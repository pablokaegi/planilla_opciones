/**
 * blackScholes.ts
 * Motor matemático portado de Python para cálculo de precios y griegas en el cliente.
 * Reemplaza la dependencia de scipy.stats.norm y py_vollib.
 */

// Aproximación de la función de error (erf) para la distribución normal acumulada
// Precisión: error absoluto < 1.5 * 10^-7
const erf = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const t = 1.0 / (1.0 + p * absX);
  const y =
    1.0 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);

  return sign * y;
};

// Cumulative Distribution Function (CDF) normal estándar N(x)
// Equivalente a scipy.stats.norm.cdf(x)
export const stdNormCDF = (x: number): number => {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
};

// Probability Density Function (PDF) normal estándar N'(x)
// Equivalente a scipy.stats.norm.pdf(x)
export const stdNormPDF = (x: number): number => {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
};

export interface GreeksResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

/**
 * Calcula Precio y Griegas usando Black-Scholes-Merton
 * @param S Precio del subyacente (Spot)
 * @param K Precio de ejercicio (Strike)
 * @param T Tiempo hasta vencimiento en años (DTE / 365)
 * @param r Tasa libre de riesgo anual (ej. 0.26 para 26%)
 * @param sigma Volatilidad implícita anual (ej. 0.40 para 40%)
 * @param type Tipo de opción ('call' o 'put')
 */
export const calculateGreeks = (
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'call' | 'put'
): GreeksResult => {
  // Manejo de casos borde (vencimiento inmediato)
  if (T <= 0 || sigma <= 0) {
    const intrinsic = type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
    return { price: intrinsic, delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const Nd1 = stdNormCDF(d1);
  const Nd2 = stdNormCDF(d2);
  const N_d1 = stdNormCDF(-d1);
  const N_d2 = stdNormCDF(-d2);
  const pdf_d1 = stdNormPDF(d1);

  let price = 0;
  let delta = 0;
  let theta = 0;
  let rho = 0;

  // Gamma y Vega son iguales para Call y Put
  const gamma = pdf_d1 / (S * sigma * Math.sqrt(T));
  const vega = (S * pdf_d1 * Math.sqrt(T)) / 100; // Dividido por 100 para escalar a 1% de cambio en vol

  if (type === 'call') {
    price = S * Nd1 - K * Math.exp(-r * T) * Nd2;
    delta = Nd1;
    
    // Theta Call: -(S*pdf_d1*sigma)/(2*sqrt(T)) - r*K*exp(-rT)*N(d2)
    const thetaTerm1 = -(S * pdf_d1 * sigma) / (2 * Math.sqrt(T));
    const thetaTerm2 = -r * K * Math.exp(-r * T) * Nd2;
    theta = (thetaTerm1 + thetaTerm2) / 365; // Theta diario

    rho = (K * T * Math.exp(-r * T) * Nd2) / 100;
  } else {
    // Put
    price = K * Math.exp(-r * T) * N_d2 - S * N_d1;
    delta = N_d1 - 1; // Equivalente a Nd1 - 1

    // Theta Put: -(S*pdf_d1*sigma)/(2*sqrt(T)) + r*K*exp(-rT)*N(-d2)
    const thetaTerm1 = -(S * pdf_d1 * sigma) / (2 * Math.sqrt(T));
    const thetaTerm2 = r * K * Math.exp(-r * T) * N_d2;
    theta = (thetaTerm1 + thetaTerm2) / 365; // Theta diario

    rho = (-K * T * Math.exp(-r * T) * N_d2) / 100;
  }

  return { price, delta, gamma, theta, vega, rho };
};
