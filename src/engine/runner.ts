/**
 * DSSAT CROPGRO-Strawberry 主模拟运行器
 * 整合所有模块，执行逐日模拟循环
 * 管理植物状态和土壤状态的初始化、更新和输出
 */

import {
  SimulationConfig,
  SimulationResult,
  SimulationSummary,
  PlantState,
  SoilState,
  DailyOutput,
  HarvestRecord,
  GrowthStage,
  DailyWeather,
  ManagementEvent,
} from './types';

// 物候模块
import { calcGDD, calcDevelopmentRate, determineStageTransition, getDayOfYear, calcDayLength } from './phenology';

// 光合作用模块
import {
  calcCanopyPhotosynthesis,
  calcMaintenanceRespiration,
  calcGrowthRespiration,
  calcPotentialDryMatter,
  calcLeafSenescence,
} from './photosynthesis';

// 土壤水分模块
import {
  calcPET,
  calcSoilEvaporation,
  calcPlantTranspiration,
  calcRunoff,
  updateSoilWater,
} from './soil-water';

// 土壤氮素模块
import {
  calcNitrogenUptake,
  calcNitrogenDemand,
  updateSoilNitrogen,
  calcNitrogenStressFactor,
} from './soil-nitrogen';

// 草莓专用模块
import {
  calcContinuousFlowering,
  calcStrawberryPartitioning,
  handleMultipleHarvests,
  calcPhotoThermalAgeIncrement,
  calcStrawberryRootGrowth,
  updatePlantAfterHarvest,
} from './strawberry';

// 品质预测模块
import { predictFruitQuality } from './quality';

// 胁迫因子模块
import {
  calcWaterStress,
  calcNitrogenStress,
  calcTemperatureStress,
} from './stress';

/**
 * 模拟运行器类
 * 负责初始化、逐日步进和完成模拟
 */
export class SimulationRunner {
  private config: SimulationConfig;
  private plantState: PlantState;
  private soilState: SoilState;
  private dailyOutputs: DailyOutput[];
  private harvests: HarvestRecord[];
  private currentDateIndex: number;
  private plantingDate: number;
  private isPlanted: boolean;
  private cumulativeIrrig: number;
  private cumulativeRain: number;
  private cumulativeRunoff: number;
  private cumulativeDrainage: number;
  private dailyDrainage: number;
  private dailyIrrig: number;
  private dailyRunoff: number;
  private done: boolean;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.plantState = this.initPlantState();
    this.soilState = this.initSoilState();
    this.dailyOutputs = [];
    this.harvests = [];
    this.currentDateIndex = 0;
    this.plantingDate = 0;
    this.isPlanted = false;
    this.cumulativeIrrig = 0;
    this.cumulativeRain = 0;
    this.cumulativeRunoff = 0;
    this.cumulativeDrainage = 0;
    this.dailyDrainage = 0;
    this.dailyIrrig = 0;
    this.dailyRunoff = 0;
    this.done = false;
  }

  /**
   * 初始化植物状态
   */
  private initPlantState(): PlantState {
    const eco = this.config.ecotype;
    return {
      dap: 0,
      stage: GrowthStage.PrePlanting,
      gdd: 0,
      lai: 0,
      biomass: 0,
      leafWt: 0,
      stemWt: 0,
      rootWt: 0,
      fruitWt: 0,
      nStress: 1,
      wStress: 1,
      tStress: 1,
      rootDepth: eco.rtdepinit,
      plantN: 0,
      leafN: 0,
      stemN: 0,
      rootN: 0,
      fruitN: 0,
      carbh2o: 0,
      carbh2oPot: 0,
      maintResp: 0,
      growResp: 0,
      ep: 0,
      eop: 0,
      activeTrusses: 0,
      fruitNum: 0,
      harvestedFreshWt: 0,
      harvestedDryWt: 0,
      flrGddCounter: 0,
      photoThermalAge: 0,
      senescedLeaf: 0,
    };
  }

  /**
   * 初始化土壤状态
   * 各层含水量设为排水上限(DUL)，氮素含量从土壤参数初始化
   */
  private initSoilState(): SoilState {
    const layers = this.config.soil.layers;
    const swContent: number[] = [];
    const no3: number[] = [];
    const nh4: number[] = [];
    const mineralization: number[] = [];

    for (const layer of layers) {
      // 初始含水量设为排水上限的90% (略低于田间持水量)
      swContent.push(layer.sldul * 0.9);

      // 初始NO3含量 (μg N/g → kg N/ha)
      // 转换: μg/g × 容重(g/cm³) × 层厚(cm) × 1e5(cm²/ha) / 1e6(μg→kg)
      const no3Kg = layer.slno3 * layer.slbdm * layer.sldm * 0.1;
      no3.push(no3Kg);

      // 初始NH4含量
      const nh4Kg = layer.slnh4 * layer.slbdm * layer.sldm * 0.1;
      nh4.push(nh4Kg);

      mineralization.push(0);
    }

    return {
      swContent,
      no3,
      nh4,
      mineralization,
      runoff: 0,
      drainage: 0,
      evapCum: 0,
      transCum: 0,
      stage1Evap: 0,
      es: 0,
      eos: 0,
    };
  }

  /**
   * 重置模拟状态
   */
  reset(): void {
    this.plantState = this.initPlantState();
    this.soilState = this.initSoilState();
    this.dailyOutputs = [];
    this.harvests = [];
    this.currentDateIndex = 0;
    this.plantingDate = 0;
    this.isPlanted = false;
    this.cumulativeIrrig = 0;
    this.cumulativeRain = 0;
    this.cumulativeRunoff = 0;
    this.cumulativeDrainage = 0;
    this.dailyDrainage = 0;
    this.dailyIrrig = 0;
    this.dailyRunoff = 0;
    this.done = false;
  }

  /**
   * 运行完整模拟
   */
  run(): SimulationResult {
    this.reset();

    const weatherDays = this.config.weather.days;

    // 找到模拟开始日期的索引
    const startIdx = weatherDays.findIndex(d => d.date >= this.config.startDate);
    const endIdx = weatherDays.findIndex(d => d.date > this.config.endDate);

    this.currentDateIndex = startIdx >= 0 ? startIdx : 0;
    const lastIdx = endIdx >= 0 ? endIdx - 1 : weatherDays.length - 1;

    // 逐日模拟循环
    while (this.currentDateIndex <= lastIdx && !this.done) {
      this.step();
      this.currentDateIndex++;
    }

    return this.buildResult();
  }

  /**
   * 执行一天模拟步进
   */
  step(): { plantState: PlantState; soilState: SoilState; done: boolean } {
    const weatherDays = this.config.weather.days;
    if (this.currentDateIndex >= weatherDays.length) {
      this.done = true;
      return { plantState: this.plantState, soilState: this.soilState, done: true };
    }

    const today = weatherDays[this.currentDateIndex];
    const species = this.config.species;
    const ecotype = this.config.ecotype;
    const cultivar = this.config.cultivar;
    const soil = this.config.soil;

    // 重置日累计变量
    this.dailyIrrig = 0;
    this.dailyRunoff = 0;

    // 1. 处理管理事件
    this.processManagementEvents(today);

    // 2. 如果尚未种植，跳过植物生长计算
    if (!this.isPlanted) {
      this.recordDailyOutput(today, 0, 0, 0);
      return { plantState: this.plantState, soilState: this.soilState, done: false };
    }

    // 3. 计算当日气象参数
    const tavg = (today.tmax + today.tmin) / 2;
    const doy = getDayOfYear(today.date);
    const daylength = calcDayLength(this.config.weather.lat, doy);

    // 4. 计算生长度日(GDD)和发育速率
    const gdd = calcGDD(today.tmin, today.tmax, species.tbase, species.topt, species.tmax);
    const effectiveGDD = calcDevelopmentRate(gdd, daylength, species.cphot, species.ppfpe);

    // 5. 更新植物物候阶段
    const newStage = determineStageTransition(
      this.plantState, species, cultivar, ecotype, effectiveGDD
    );

    // 6. 计算胁迫因子
    // 温度胁迫
    const tStress = calcTemperatureStress(tavg, species.tbase, species.topt, species.tmax, 'photosynthesis');

    // 水分胁迫 (使用上一步的蒸腾数据)
    const wStress = calcWaterStress(
      this.plantState.ep, this.plantState.eop, species, 'photosynthesis'
    );

    // 7. 计算冠层光合作用
    const carbh2oPot = calcCanopyPhotosynthesis(
      today.srad, this.plantState.lai,
      cultivar.photosynmax || species.photosynmax,
      species.quantumyield,
      tavg, species.topt, species.tmax,
      wStress, this.plantState.nStress
    );

    // 8. 计算维持呼吸
    const maintResp = calcMaintenanceRespiration(
      this.plantState.leafWt, this.plantState.stemWt,
      this.plantState.rootWt, this.plantState.fruitWt,
      ecotype.rm25leaf, ecotype.rm25stem,
      ecotype.rm25root, ecotype.rm25fruit,
      tavg
    );

    // 9. 计算可用碳水化合物
    const availCH2O = calcPotentialDryMatter(carbh2oPot, maintResp);

    // 10. 干物质分配 - 使用草莓专用分配模型
    const partition = calcStrawberryPartitioning(
      this.plantState, species, ecotype, cultivar, availCH2O
    );

    // 11. 计算生长呼吸
    const totalNewDm = partition.leaf + partition.stem + partition.root + partition.fruit;
    const growResp = calcGrowthRespiration(totalNewDm, species.rg);

    // 12. 计算叶片衰老
    const senescedLeaf = calcLeafSenescence(this.plantState, species, effectiveGDD);

    // 13. 计算土壤水分平衡
    const pet = calcPET(today.srad, today.tmax, today.tmin, soil.albedo, today.wind);

    // 潜在土壤蒸发
    const eos = Math.max(0, pet * Math.exp(-0.4 * this.plantState.lai));
    const es = calcSoilEvaporation(eos, this.soilState, soil);

    // 植物蒸腾
    const eop = Math.max(0, pet - eos);
    const ep = calcPlantTranspiration(pet, eos, this.plantState.lai, wStress);

    // 径流
    const runoff = calcRunoff(today.rain, soil.cn2);
    this.dailyRunoff = runoff;

    // 更新土壤水分
    const swResult = updateSoilWater(
      this.soilState, soil,
      today.rain, this.dailyIrrig,
      es, ep, runoff,
      this.plantState.rootDepth
    );

    this.dailyDrainage = swResult.dailyDrainage;

    // 14. 计算氮素平衡
    const nDemand = calcNitrogenDemand(
      this.plantState, species,
      partition.leaf, partition.stem, partition.root, partition.fruit
    );

    const { totalUptake: nUptake, layerUptake: nLayerUptake } = calcNitrogenUptake(
      this.plantState, this.soilState, soil, species, this.plantState.rootDepth
    );

    // 氮胁迫
    const nStress = calcNitrogenStress(this.plantState, species, nUptake, nDemand);

    // 更新土壤氮素
    const soilNResult = updateSoilNitrogen(
      this.soilState, soil, tavg,
      this.dailyDrainage, nLayerUptake, 0 // 肥料在管理事件中处理
    );

    // 15. 更新光热年龄
    const ptaIncrement = calcPhotoThermalAgeIncrement(effectiveGDD, daylength, tavg);

    // 16. 更新根系深度
    const newRootDepth = calcStrawberryRootGrowth(
      this.plantState.rootDepth, effectiveGDD,
      ecotype.rtdepmax, species.rgrw, wStress, newStage
    );

    // 17. 更新LAI
    const newLai = this.updateLAI(
      this.plantState.lai, partition.leaf, senescedLeaf,
      cultivar.sla || species.sla, cultivar.laimax || species.laimax
    );

    // 18. 连续开花计算
    const { activeTrusses, fruitNum, flrGddCounter } = calcContinuousFlowering(
      this.plantState, species, cultivar, effectiveGDD, daylength, tavg
    );

    // 19. 更新植物状态
    const newLeafWt = this.plantState.leafWt + partition.leaf - senescedLeaf;
    const newStemWt = this.plantState.stemWt + partition.stem;
    const newRootWt = this.plantState.rootWt + partition.root;
    const newFruitWt = this.plantState.fruitWt + partition.fruit;

    // 氮在各器官的分配
    const nToLeaf = nUptake * (species.nleafhf / (species.nleafhf + species.nstem + species.nroot + species.nfruit));
    const nToStem = nUptake * (species.nstem / (species.nleafhf + species.nstem + species.nroot + species.nfruit));
    const nToRoot = nUptake * (species.nroot / (species.nleafhf + species.nstem + species.nroot + species.nfruit));
    const nToFruit = nUptake * (species.nfruit / (species.nleafhf + species.nstem + species.nroot + species.nfruit));

    this.plantState = {
      dap: this.plantState.dap + 1,
      stage: newStage,
      gdd: this.plantState.gdd + effectiveGDD,
      lai: newLai,
      biomass: Math.max(0, newLeafWt + newStemWt + newRootWt + newFruitWt),
      leafWt: Math.max(0, newLeafWt),
      stemWt: Math.max(0, newStemWt),
      rootWt: Math.max(0, newRootWt),
      fruitWt: Math.max(0, newFruitWt),
      nStress: nStress,
      wStress: wStress,
      tStress: tStress,
      rootDepth: newRootDepth,
      plantN: this.plantState.leafN + this.plantState.stemN + this.plantState.rootN + this.plantState.fruitN + nUptake,
      leafN: Math.max(0, this.plantState.leafN + nToLeaf - senescedLeaf * (this.plantState.leafN / this.plantState.leafWt || 0)),
      stemN: Math.max(0, this.plantState.stemN + nToStem),
      rootN: Math.max(0, this.plantState.rootN + nToRoot),
      fruitN: Math.max(0, this.plantState.fruitN + nToFruit),
      carbh2o: availCH2O,
      carbh2oPot: carbh2oPot,
      maintResp: maintResp,
      growResp: growResp,
      ep: ep,
      eop: eop,
      activeTrusses: activeTrusses,
      fruitNum: fruitNum,
      harvestedFreshWt: this.plantState.harvestedFreshWt,
      harvestedDryWt: this.plantState.harvestedDryWt,
      flrGddCounter: flrGddCounter,
      photoThermalAge: this.plantState.photoThermalAge + ptaIncrement,
      senescedLeaf: this.plantState.senescedLeaf + senescedLeaf,
    };

    // 20. 更新土壤状态
    this.soilState = {
      swContent: swResult.swContent,
      no3: soilNResult.no3,
      nh4: soilNResult.nh4,
      mineralization: soilNResult.mineralization,
      runoff: this.soilState.runoff + runoff,
      drainage: this.soilState.drainage + this.dailyDrainage,
      evapCum: this.soilState.evapCum + es,
      transCum: this.soilState.transCum + ep,
      stage1Evap: this.soilState.stage1Evap + es,
      es: es,
      eos: eos,
    };

    // 21. 累积统计
    this.cumulativeRain += today.rain;
    this.cumulativeRunoff += runoff;
    this.cumulativeDrainage += this.dailyDrainage;

    // 22. 检查是否到达结束条件
    if (today.date >= this.config.endDate) {
      this.done = true;
    }

    // 23. 记录逐日输出
    this.recordDailyOutput(today, es, ep, runoff);

    return { plantState: this.plantState, soilState: this.soilState, done: this.done };
  }

  /**
   * 处理管理事件
   */
  private processManagementEvents(today: DailyWeather): void {
    const events = this.config.management.filter(e => e.date === today.date);

    for (const event of events) {
      switch (event.eventType) {
        case 'planting':
          this.handlePlanting(event);
          break;
        case 'irrigation':
          this.handleIrrigation(event);
          break;
        case 'fertilizer':
          this.handleFertilizer(event);
          break;
        case 'harvest':
          this.handleHarvest(event, today);
          break;
      }
    }
  }

  /**
   * 处理种植事件
   */
  private handlePlanting(event: ManagementEvent): void {
    if (this.isPlanted) return;

    this.isPlanted = true;
    this.plantingDate = event.date;
    this.plantState.stage = GrowthStage.Germinating;
    this.plantState.dap = 0;

    // 初始生物量 (种子/种苗干重)
    const seedWeight = (event.details.seedWeight as number) || 5; // kg/ha
    this.plantState.leafWt = seedWeight * 0.3;
    this.plantState.stemWt = seedWeight * 0.2;
    this.plantState.rootWt = seedWeight * 0.5;
    this.plantState.biomass = seedWeight;

    // 初始LAI
    const sla = this.config.cultivar.sla || this.config.species.sla;
    this.plantState.lai = this.plantState.leafWt * sla * 0.1 / 10000;

    // 初始氮含量
    this.plantState.leafN = this.plantState.leafWt * this.config.species.nleafhf;
    this.plantState.stemN = this.plantState.stemWt * this.config.species.nstem;
    this.plantState.rootN = this.plantState.rootWt * this.config.species.nroot;
    this.plantState.plantN = this.plantState.leafN + this.plantState.stemN + this.plantState.rootN;
  }

  /**
   * 处理灌溉事件
   */
  private handleIrrigation(event: ManagementEvent): void {
    this.dailyIrrig += event.amount;
    this.cumulativeIrrig += event.amount;
  }

  /**
   * 处理施肥事件
   */
  private handleFertilizer(event: ManagementEvent): void {
    // 将肥料添加到表层土壤
    const fertAmount = event.amount; // kg N/ha
    if (this.soilState.nh4.length > 0) {
      // 假设50%铵态氮，50%硝态氮
      this.soilState.nh4[0] += fertAmount * 0.5;
      this.soilState.no3[0] += fertAmount * 0.5;
    }
  }

  /**
   * 处理收获事件
   */
  private handleHarvest(event: ManagementEvent, today: DailyWeather): void {
    const harvest = handleMultipleHarvests(
      this.plantState, this.config.species, this.config.cultivar, true
    );

    if (harvest) {
      // 设置收获日期
      harvest.date = today.date;

      // 预测果实品质
      const quality = predictFruitQuality(
        this.config.species.sscbase,
        this.config.species.acidbase,
        this.config.species.firmbase,
        this.config.weather.days,
        this.currentDateIndex,
        10
      );

      harvest.ssc = quality.ssc;
      harvest.acidity = quality.acidity;
      harvest.firmness = quality.firmness;

      this.harvests.push(harvest);

      // 更新植物状态
      const updates = updatePlantAfterHarvest(this.plantState, harvest);
      Object.assign(this.plantState, updates);
    }
  }

  /**
   * 更新LAI - 内部辅助方法
   */
  private updateLAI(
    currentLAI: number,
    newLeafWt: number,
    senescedLeaf: number,
    sla: number,
    laimax: number
  ): number {
    // 比叶面积转换: cm²/g → m²/kg
    const slaM2PerKg = sla * 0.1; // 简化转换

    // 新增叶面积
    const newLAI = newLeafWt * slaM2PerKg / 10000 * 10000;

    // 衰老减少的叶面积
    const senLAI = senescedLeaf * slaM2PerKg / 10000 * 10000;

    // 更新LAI
    let lai = currentLAI + newLAI - senLAI;

    return Math.max(0, Math.min(laimax, lai));
  }

  /**
   * 记录逐日输出
   */
  private recordDailyOutput(
    today: DailyWeather,
    es: number,
    ep: number,
    runoff: number
  ): void {
    const output: DailyOutput = {
      day: today.date,
      das: this.plantState.dap,
      lai: this.plantState.lai,
      biomass: this.plantState.biomass,
      leafWt: this.plantState.leafWt,
      stemWt: this.plantState.stemWt,
      rootWt: this.plantState.rootWt,
      fruitWt: this.plantState.fruitWt,
      swfac: this.plantState.wStress,
      nstres: this.plantState.nStress,
      tfac: this.plantState.tStress,
      stage: this.plantState.stage,
      gdd: this.plantState.gdd,
      rootDepth: this.plantState.rootDepth,
      rain: today.rain,
      irrig: this.dailyIrrig,
      et: es + ep,
      runoff: runoff,
      drainage: this.dailyDrainage,
      tmax: today.tmax,
      tmin: today.tmin,
      srad: today.srad,
      activeTrusses: this.plantState.activeTrusses,
      fruitNum: this.plantState.fruitNum,
      carbh2o: this.plantState.carbh2o,
      plantN: this.plantState.plantN,
    };

    this.dailyOutputs.push(output);
  }

  /**
   * 构建模拟结果
   */
  private buildResult(): SimulationResult {
    const summary = this.calcSummary();

    return {
      config: this.config,
      dailyOutputs: this.dailyOutputs,
      harvests: this.harvests,
      summary,
    };
  }

  /**
   * 计算模拟结果摘要
   */
  private calcSummary(): SimulationSummary {
    const plant = this.plantState;
    const fruitdm = this.config.cultivar.fruitdm || this.config.species.fruitdm;

    // 总果实鲜重 (包括已收获和当前果实)
    const totalFruitDryWt = plant.harvestedDryWt + plant.fruitWt;
    const totalFruitFreshWt = plant.harvestedFreshWt + plant.fruitWt / fruitdm;

    // 收获指数
    const harvestIndex = plant.biomass > 0 ? totalFruitDryWt / plant.biomass : 0;

    // 平均果实鲜重 (g)
    const totalFruitNum = plant.fruitNum;
    const avgFruitFreshWt = totalFruitNum > 0
      ? (totalFruitFreshWt * 1000) / totalFruitNum
      : 0;

    // 平均品质指标
    const avgSSC = this.harvests.length > 0
      ? this.harvests.reduce((s, h) => s + h.ssc, 0) / this.harvests.length
      : this.config.species.sscbase;

    const avgAcidity = this.harvests.length > 0
      ? this.harvests.reduce((s, h) => s + h.acidity, 0) / this.harvests.length
      : this.config.species.acidbase;

    const avgFirmness = this.harvests.length > 0
      ? this.harvests.reduce((s, h) => s + h.firmness, 0) / this.harvests.length
      : this.config.species.firmbase;

    // 累积蒸散量
    const totalET = this.soilState.evapCum + this.soilState.transCum;

    // 水分利用效率 (kg 果实鲜重 / m³ 水)
    const wue = totalET > 0 ? (totalFruitFreshWt / (totalET * 10)) : 0;

    return {
      totalBiomass: plant.biomass,
      totalFruitFreshWt,
      totalFruitDryWt,
      harvestIndex,
      totalFruitNum,
      avgFruitFreshWt,
      avgSSC,
      avgAcidity,
      avgFirmness,
      totalET,
      totalRain: this.cumulativeRain,
      totalIrrig: this.cumulativeIrrig,
      totalRunoff: this.cumulativeRunoff,
      totalDrainage: this.cumulativeDrainage,
      wue,
      simDays: this.dailyOutputs.length,
      finalLAI: plant.lai,
    };
  }
}

/**
 * 创建模拟运行器的便捷函数
 * @param config 模拟配置
 * @returns 模拟运行器实例
 */
export function createSimulationRunner(config: SimulationConfig): SimulationRunner {
  return new SimulationRunner(config);
}

/**
 * 运行模拟的便捷函数
 * @param config 模拟配置
 * @returns 模拟结果
 */
export function runSimulation(config: SimulationConfig): SimulationResult {
  const runner = new SimulationRunner(config);
  return runner.run();
}
