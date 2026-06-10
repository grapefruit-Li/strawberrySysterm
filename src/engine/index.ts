/**
 * DSSAT CROPGRO-Strawberry 模拟引擎
 * 统一导出入口
 */

// 类型定义
export type {
  DailyWeather,
  WeatherStation,
  SoilLayer,
  SoilProfile,
  SpeciesParams,
  EcotypeParams,
  CultivarParams,
  ManagementEventType,
  ManagementEvent,
  SimulationConfig,
  PlantState,
  SoilState,
  DailyOutput,
  HarvestRecord,
  SimulationSummary,
  SimulationResult,
  RegionConfig,
  CultivarFullParams,
  RiskLevel,
  PestRiskRecord,
  FarmOperation,
  PhenologyEvent,
  ChainSimulationResult,
} from './types';

export { GrowthStage } from './types';

// 物候模块
export {
  calcGDD,
  calcPhotoperiodFactor,
  calcDayLength,
  calcDevelopmentRate,
  determineStageTransition,
  getDayOfYear,
  calcTemperatureStress as calcPhenologyTemperatureStress,
} from './phenology';

// 光合作用模块
export {
  calcCanopyPhotosynthesis,
  calcMaintenanceRespiration,
  calcGrowthRespiration,
  calcPotentialDryMatter,
  calcPartitioning,
  updateLAI,
  calcLeafSenescence,
} from './photosynthesis';

// 土壤水分模块
export {
  calcPET,
  calcSoilEvaporation,
  calcPlantTranspiration,
  calcRunoff,
  calcDrainage,
  updateSoilWater,
  calcWaterStressFactor,
  calcAvailableWater,
} from './soil-water';

// 土壤氮素模块
export {
  calcMineralization,
  calcNitrification,
  calcDenitrification,
  calcNitrogenUptake,
  calcNitrogenStressFactor,
  updateSoilNitrogen,
  calcNitrogenDemand,
} from './soil-nitrogen';

// 草莓专用模块
export {
  calcContinuousFlowering,
  calcStrawberryPartitioning,
  handleMultipleHarvests,
  calcFreshFruitWeight,
  calcIndividualFruitWeight,
  updatePlantAfterHarvest,
  calcPhotoThermalAgeIncrement,
  calcStrawberryRootGrowth,
} from './strawberry';

// 品质预测模块
export {
  calcPreHarvestWeatherIndices,
  predictSSC,
  predictAcidity,
  predictFirmness,
  predictFruitQuality,
  updateHarvestQuality,
} from './quality';

// 胁迫因子模块
export {
  calcWaterStress,
  calcCombinedWaterStress,
  calcNitrogenStress,
  calcTemperatureStress,
  calcCombinedStress,
  adjustPartitioningForStress,
} from './stress';

// 模拟运行器
export {
  SimulationRunner,
  createSimulationRunner,
  runSimulation,
} from './runner';

// 病虫害风险预测模块
export {
  calculatePestRisks,
} from './pest-risk';

// 农事操作建议模块
export {
  generateFarmOperations,
} from './farm-operations';
