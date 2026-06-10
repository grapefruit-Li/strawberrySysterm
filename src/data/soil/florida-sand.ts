/**
 * 佛罗里达典型砂质土壤剖面数据
 * 适用于CROPGRO-Strawberry模型
 * 基于佛罗里达中部Myakka细砂土特征
 */
import type { SoilProfile } from '@/engine/types'

/** 佛罗里达砂质土壤剖面 */
export const floridaSandProfile: SoilProfile = {
  soilId: 'FLSAND001',
  name: 'Florida Sandy Soil',
  albedo: 0.13,       // 砂土反照率
  u: 6.0,             // 第一阶段蒸发上限 (mm)
  cn2: 68.0,          // SCS曲线数（砂土中等偏低）
  slnf: 0.8,          // 氮矿化因子
  slpf: 0.85,         // 磷因子
  layers: [
    {
      layerNum: 1,
      sldm: 15,        // 表层0-15cm厚度
      slll: 0.035,     // 萎蔫点
      sldul: 0.125,    // 田间持水量
      slsat: 0.395,    // 饱和含水量
      slrgf: 0.40,     // 根系生长因子（表层根系密集）
      slks: 15.0,      // 饱和导水率 (cm/h) - 砂土高导水
      slbdm: 1.45,     // 容重
      sloc: 1.8,       // 有机碳含量（表层较高）
      slph: 6.2,       // pH
      slcl: 3.5,       // 粘粒
      slsi: 4.5,       // 粉粒
      slcf: 2.0,       // 粗砂
      slnh4: 5.0,      // 铵态氮
      slno3: 8.0,      // 硝态氮
    },
    {
      layerNum: 2,
      sldm: 20,        // 15-35cm
      slll: 0.040,
      sldul: 0.110,
      slsat: 0.370,
      slrgf: 0.30,
      slks: 12.0,
      slbdm: 1.52,
      sloc: 0.8,
      slph: 6.0,
      slcl: 4.0,
      slsi: 5.0,
      slcf: 2.5,
      slnh4: 3.0,
      slno3: 5.0,
    },
    {
      layerNum: 3,
      sldm: 25,        // 35-60cm
      slll: 0.050,
      sldul: 0.105,
      slsat: 0.360,
      slrgf: 0.18,
      slks: 10.0,
      slbdm: 1.55,
      sloc: 0.4,
      slph: 5.8,
      slcl: 5.0,
      slsi: 5.5,
      slcf: 3.0,
      slnh4: 2.0,
      slno3: 3.0,
    },
    {
      layerNum: 4,
      sldm: 30,        // 60-90cm
      slll: 0.060,
      sldul: 0.120,
      slsat: 0.355,
      slrgf: 0.08,
      slks: 8.0,
      slbdm: 1.58,
      sloc: 0.2,
      slph: 5.5,
      slcl: 6.5,
      slsi: 6.5,
      slcf: 3.5,
      slnh4: 1.5,
      slno3: 2.0,
    },
    {
      layerNum: 5,
      sldm: 30,        // 90-120cm
      slll: 0.065,
      sldul: 0.130,
      slsat: 0.350,
      slrgf: 0.04,
      slks: 6.0,
      slbdm: 1.60,
      sloc: 0.1,
      slph: 5.3,
      slcl: 8.0,
      slsi: 8.0,
      slcf: 4.0,
      slnh4: 1.0,
      slno3: 1.5,
    },
  ],
}
