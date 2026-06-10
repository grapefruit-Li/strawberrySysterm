/**
 * 草莓品种完整参数数据
 */
import type { CultivarFullParams } from '@/engine/types'
import { floridaShortDayEcotype } from './florida-cultivars'

const caDayNeutralEcotype = {
  ecoCode: 'CADN001', name: 'California Day-Neutral', tbase: 6.0, topt: 20.0, tmax: 33.0,
  cphot: 14.0, ppfpe: 0.001, laimax: 3.8, sla: 320, photosynmax: 1.25,
  rm25leaf: 0.028, rm25stem: 0.014, rm25root: 0.009, rm25fruit: 0.018,
  rg: 0.14, partleaf: 0.30, partstem: 0.20, partroot: 0.15, partfruit: 0.35,
  pltdensity: 10.0, rowspc: 90, rtdepinit: 5.0, rtdepmax: 50.0,
}

const caShortDayEcotype = {
  ecoCode: 'CASD001', name: 'California Short-Day', tbase: 5.0, topt: 20.0, tmax: 33.0,
  cphot: 12.0, ppfpe: 0.003, laimax: 4.2, sla: 340, photosynmax: 1.20,
  rm25leaf: 0.030, rm25stem: 0.015, rm25root: 0.010, rm25fruit: 0.020,
  rg: 0.15, partleaf: 0.35, partstem: 0.25, partroot: 0.15, partfruit: 0.25,
  pltdensity: 8.0, rowspc: 100, rtdepinit: 5.0, rtdepmax: 60.0,
}

const jpShortDayEcotype = {
  ecoCode: 'JPSD001', name: 'Japan Short-Day', tbase: 5.0, topt: 18.0, tmax: 30.0,
  cphot: 12.0, ppfpe: 0.003, laimax: 4.5, sla: 350, photosynmax: 1.15,
  rm25leaf: 0.030, rm25stem: 0.015, rm25root: 0.010, rm25fruit: 0.020,
  rg: 0.15, partleaf: 0.35, partstem: 0.25, partroot: 0.15, partfruit: 0.25,
  pltdensity: 8.0, rowspc: 100, rtdepinit: 5.0, rtdepmax: 60.0,
}

const cnShortDayEcotype = {
  ecoCode: 'CNSD001', name: 'China Short-Day', tbase: 5.0, topt: 19.0, tmax: 31.0,
  cphot: 12.0, ppfpe: 0.003, laimax: 4.3, sla: 345, photosynmax: 1.18,
  rm25leaf: 0.029, rm25stem: 0.014, rm25root: 0.010, rm25fruit: 0.019,
  rg: 0.15, partleaf: 0.35, partstem: 0.25, partroot: 0.15, partfruit: 0.25,
  pltdensity: 8.0, rowspc: 100, rtdepinit: 5.0, rtdepmax: 60.0,
}

export const strawberryCultivars: CultivarFullParams[] = [
  {
    code: 'FL-RADIANCE', name: 'Florida Radiance', type: '短日型', origin: '美国佛罗里达',
    fruitDesc: '果实圆锥形，亮红色，早熟高产，适合冬季生产',
    keyParams: { avgFruitWeight: 22, ssc: 8.5, firmness: 2.8, harvestIndex: 0.52 }, reliability: 5,
    cultivarParams: { culCode: 'FLRADI', name: 'Florida Radiance', ecoCode: 'FLSD0001', cropCode: 'SWBRRY', p1v: 320, p1r: 300, p3: 230, p4: 320, laimax: 4.2, sla: 340, photosynmax: 1.15, hi: 0.52, fruitdm: 0.095, nfruit: 0.008, flrinterval: 75, maxfruitpertruss: 4 },
    ecotypeParams: floridaShortDayEcotype,
  },
  {
    code: 'FL-BRILLIANCE', name: 'Florida Brilliance', type: '短日型', origin: '美国佛罗里达',
    fruitDesc: '果实短圆锥形，深红色，风味极佳，产量高',
    keyParams: { avgFruitWeight: 25, ssc: 9.0, firmness: 3.0, harvestIndex: 0.56 }, reliability: 5,
    cultivarParams: { culCode: 'FLBRIL', name: 'Florida Brilliance', ecoCode: 'FLSD0001', cropCode: 'SWBRRY', p1v: 340, p1r: 320, p3: 240, p4: 340, laimax: 4.5, sla: 360, photosynmax: 1.25, hi: 0.56, fruitdm: 0.100, nfruit: 0.009, flrinterval: 80, maxfruitpertruss: 5 },
    ecotypeParams: floridaShortDayEcotype,
  },
  {
    code: 'CA-ALBION', name: 'Albion', type: '日中性', origin: '美国加州',
    fruitDesc: '果实长圆锥形，深红色，硬度高，适合长途运输',
    keyParams: { avgFruitWeight: 24, ssc: 9.5, firmness: 3.2, harvestIndex: 0.50 }, reliability: 5,
    cultivarParams: { culCode: 'ALBION', name: 'Albion', ecoCode: 'CADN001', cropCode: 'SWBRRY', p1v: 280, p1r: 260, p3: 200, p4: 300, laimax: 3.8, sla: 320, photosynmax: 1.20, hi: 0.50, fruitdm: 0.105, nfruit: 0.009, flrinterval: 60, maxfruitpertruss: 5 },
    ecotypeParams: caDayNeutralEcotype,
  },
  {
    code: 'CA-CAMAROSA', name: 'Camarosa', type: '短日型', origin: '美国加州',
    fruitDesc: '果实大，硬度极好，经典加工品种',
    keyParams: { avgFruitWeight: 26, ssc: 8.0, firmness: 3.5, harvestIndex: 0.48 }, reliability: 5,
    cultivarParams: { culCode: 'CAMAROSA', name: 'Camarosa', ecoCode: 'CASD001', cropCode: 'SWBRRY', p1v: 350, p1r: 330, p3: 250, p4: 350, laimax: 4.0, sla: 330, photosynmax: 1.18, hi: 0.48, fruitdm: 0.100, nfruit: 0.008, flrinterval: 85, maxfruitpertruss: 4 },
    ecotypeParams: caShortDayEcotype,
  },
  {
    code: 'FL-SWEET-CHARLIE', name: 'Sweet Charlie', type: '短日型', origin: '美国佛罗里达',
    fruitDesc: '极早熟品种，糖度极高，硬度较差',
    keyParams: { avgFruitWeight: 18, ssc: 10.5, firmness: 2.2, harvestIndex: 0.45 }, reliability: 5,
    cultivarParams: { culCode: 'SWCHARLIE', name: 'Sweet Charlie', ecoCode: 'FLSD0001', cropCode: 'SWBRRY', p1v: 280, p1r: 260, p3: 210, p4: 300, laimax: 3.5, sla: 330, photosynmax: 1.10, hi: 0.45, fruitdm: 0.090, nfruit: 0.007, flrinterval: 70, maxfruitpertruss: 4 },
    ecotypeParams: floridaShortDayEcotype,
  },
  {
    code: 'CA-CHANDLER', name: 'Chandler', type: '短日型', origin: '美国加州',
    fruitDesc: '经典品种，果实大，适合加工和鲜食',
    keyParams: { avgFruitWeight: 23, ssc: 8.8, firmness: 2.8, harvestIndex: 0.46 }, reliability: 3,
    cultivarParams: { culCode: 'CHANDLER', name: 'Chandler', ecoCode: 'CASD001', cropCode: 'SWBRRY', p1v: 360, p1r: 340, p3: 260, p4: 360, laimax: 4.0, sla: 335, photosynmax: 1.16, hi: 0.46, fruitdm: 0.098, nfruit: 0.008, flrinterval: 85, maxfruitpertruss: 4 },
    ecotypeParams: caShortDayEcotype,
  },
  {
    code: 'CA-SEASCAPE', name: 'Seascape', type: '日中性', origin: '美国加州',
    fruitDesc: '日中性品种，果实均匀，适合连续采收',
    keyParams: { avgFruitWeight: 22, ssc: 9.0, firmness: 3.0, harvestIndex: 0.48 }, reliability: 3,
    cultivarParams: { culCode: 'SEASCAPE', name: 'Seascape', ecoCode: 'CADN001', cropCode: 'SWBRRY', p1v: 300, p1r: 280, p3: 220, p4: 310, laimax: 3.6, sla: 315, photosynmax: 1.18, hi: 0.48, fruitdm: 0.100, nfruit: 0.008, flrinterval: 62, maxfruitpertruss: 5 },
    ecotypeParams: caDayNeutralEcotype,
  },
  {
    code: 'CA-MONTEREY', name: 'Monterey', type: '日中性', origin: '美国加州',
    fruitDesc: '大果型日中性品种，产量高',
    keyParams: { avgFruitWeight: 26, ssc: 9.2, firmness: 3.0, harvestIndex: 0.50 }, reliability: 3,
    cultivarParams: { culCode: 'MONTEREY', name: 'Monterey', ecoCode: 'CADN001', cropCode: 'SWBRRY', p1v: 295, p1r: 275, p3: 215, p4: 305, laimax: 4.0, sla: 325, photosynmax: 1.22, hi: 0.50, fruitdm: 0.100, nfruit: 0.008, flrinterval: 63, maxfruitpertruss: 5 },
    ecotypeParams: caDayNeutralEcotype,
  },
  {
    code: 'CA-SAN-ANDREAS', name: 'San Andreas', type: '日中性', origin: '美国加州',
    fruitDesc: '果实长圆锥形，亮红色，风味好，产量高',
    keyParams: { avgFruitWeight: 24, ssc: 9.3, firmness: 3.3, harvestIndex: 0.53 }, reliability: 3,
    cultivarParams: { culCode: 'SANANDREAS', name: 'San Andreas', ecoCode: 'CADN001', cropCode: 'SWBRRY', p1v: 290, p1r: 270, p3: 210, p4: 310, laimax: 3.8, sla: 330, photosynmax: 1.22, hi: 0.53, fruitdm: 0.100, nfruit: 0.008, flrinterval: 65, maxfruitpertruss: 5 },
    ecotypeParams: caDayNeutralEcotype,
  },
  {
    code: 'JP-HONGYAN', name: '红颜', type: '短日型', origin: '日本/中国',
    fruitDesc: '果实圆锥形，鲜红色，风味浓郁，甜度高，中国最受欢迎品种之一',
    keyParams: { avgFruitWeight: 28, ssc: 11.0, firmness: 2.5, harvestIndex: 0.52 }, reliability: 3,
    cultivarParams: { culCode: 'BENIHOPPE', name: '红颜', ecoCode: 'JPSD001', cropCode: 'SWBRRY', p1v: 375, p1r: 350, p3: 265, p4: 370, laimax: 4.5, sla: 350, photosynmax: 1.15, hi: 0.52, fruitdm: 0.095, nfruit: 0.008, flrinterval: 75, maxfruitpertruss: 4 },
    ecotypeParams: jpShortDayEcotype,
  },
  {
    code: 'JP-TOYONOKA', name: '丰香', type: '短日型', origin: '日本/中国',
    fruitDesc: '经典品种，糖度高，硬度较差',
    keyParams: { avgFruitWeight: 20, ssc: 10.0, firmness: 2.3, harvestIndex: 0.48 }, reliability: 3,
    cultivarParams: { culCode: 'TOYONOKA', name: '丰香', ecoCode: 'JPSD001', cropCode: 'SWBRRY', p1v: 350, p1r: 330, p3: 250, p4: 350, laimax: 4.0, sla: 340, photosynmax: 1.12, hi: 0.48, fruitdm: 0.092, nfruit: 0.007, flrinterval: 80, maxfruitpertruss: 4 },
    ecotypeParams: jpShortDayEcotype,
  },
  {
    code: 'JP-AKIHIME', name: '章姬', type: '短日型', origin: '日本/中国',
    fruitDesc: '长锥形果，糖度极高，口感甜，硬度差不耐储运',
    keyParams: { avgFruitWeight: 22, ssc: 10.5, firmness: 2.0, harvestIndex: 0.46 }, reliability: 3,
    cultivarParams: { culCode: 'AKIHIME', name: '章姬', ecoCode: 'JPSD001', cropCode: 'SWBRRY', p1v: 360, p1r: 340, p3: 255, p4: 360, laimax: 4.2, sla: 345, photosynmax: 1.13, hi: 0.46, fruitdm: 0.090, nfruit: 0.007, flrinterval: 78, maxfruitpertruss: 4 },
    ecotypeParams: jpShortDayEcotype,
  },
  {
    code: 'CN-MIAOXIANG7', name: '妙香七号', type: '短日型', origin: '中国',
    fruitDesc: '中国自主培育品种，果实均匀，适应性强',
    keyParams: { avgFruitWeight: 25, ssc: 9.5, firmness: 2.8, harvestIndex: 0.50 }, reliability: 2,
    cultivarParams: { culCode: 'MIAOXIANG7', name: '妙香七号', ecoCode: 'CNSD001', cropCode: 'SWBRRY', p1v: 365, p1r: 340, p3: 260, p4: 365, laimax: 4.3, sla: 340, photosynmax: 1.17, hi: 0.50, fruitdm: 0.095, nfruit: 0.008, flrinterval: 78, maxfruitpertruss: 4 },
    ecotypeParams: cnShortDayEcotype,
  },
]
