# 📈 Inky Web - Plataforma de Análisis de Opciones Argentina

> **Professional Options Strategy Analysis Platform** para el mercado argentino (BYMA/Merval)

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan?logo=tailwindcss)

## 🎯 Descripción

Plataforma web profesional para análisis de estrategias de opciones del mercado argentino. Integra datos en tiempo real de la API de data912.com, cálculos de Greeks mediante Black-Scholes, y visualizaciones interactivas para traders e inversores.

## ✨ Características Principales

### 📊 Option Chain Grid
- Visualización estilo straddle (Calls | Strike | Puts)
- Click en Bid/Ask para agregar legs a la estrategia
- Greeks calculados en tiempo real (Delta, Gamma, Theta, Vega, IV)
- Datos de volumen y open interest

### 🎨 Strategy Builder
- Construcción de estrategias multi-leg
- Soporte para Long/Short Calls y Puts
- Ajuste de cantidad de contratos
- Cálculo automático de Net Cost y Net Delta
- Botón de Hard Reset para limpiar datos

### 📈 Strategy Analysis Dashboard
- **Payoff Diagram**: Gráfico de P&L al vencimiento con zonas de ganancia/pérdida
- **Sensitivity Table**: Tabla de sensibilidad con escenarios de precio (±50%)
- **Volatility Smile**: Curva de volatilidad implícita por strike
- **Contract Flow**: Volumen y open interest por strike
- **Strategy Metrics**: Max Profit, Max Loss, Breakevens, Probability of Profit

### 🧮 Motor de Cálculo
- Implementación completa de Black-Scholes en TypeScript
- Cálculo de IV mediante py_vollib (backend)
- Greeks: Delta, Gamma, Theta, Vega, Rho
- Tasa libre de riesgo configurable (default 26% para Argentina)
- Multiplicador de 100 acciones por contrato

## 🏗️ Arquitectura

```
inky_web/
├── frontend/                 # Next.js 15 App Router
│   ├── app/                  # Pages y layouts
│   │   ├── layout.tsx       # Root layout con providers
│   │   ├── page.tsx         # Homepage con dashboard
│   │   └── globals.css      # Estilos globales
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── OptionChainGrid.tsx   # Grilla de opciones (AG-Grid)
│   │   │   └── StrategyPanel.tsx     # Panel de estrategia
│   │   │
│   │   └── analysis/
│   │       ├── StrategyAnalysis.tsx  # Dashboard principal
│   │       ├── PayoffDiagramPro.tsx  # Gráfico de payoff (Recharts)
│   │       ├── SensitivityTablePro.tsx # Tabla de sensibilidad
│   │       ├── VolatilitySmile.tsx   # Sonrisa de volatilidad
│   │       ├── ContractFlow.tsx      # Flujo de contratos
│   │       └── StrategyMetrics.tsx   # Métricas de estrategia
│   │
│   ├── store/
│   │   └── strategyStore.ts  # Zustand state management
│   │
│   ├── utils/
│   │   ├── blackScholes.ts   # Motor Black-Scholes TypeScript
│   │   ├── sensitivity.ts    # Generador de tabla de sensibilidad
│   │   └── strategyMath.ts   # Cálculos de payoff y métricas
│   │
│   └── lib/
│       ├── api_client.ts     # Cliente Axios para backend
│       ├── query_client.tsx  # React Query provider
│       └── types.ts          # TypeScript interfaces
│
├── backend/                  # FastAPI Python
│   ├── main.py              # Entry point
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints.py  # REST API endpoints
│   │   │
│   │   ├── services/
│   │   │   ├── market_data.py # Integración data912.com
│   │   │   ├── greeks.py      # Cálculo de Greeks (py_vollib)
│   │   │   └── pricing_engine.py
│   │   │
│   │   ├── models/
│   │   │   └── schemas.py    # Pydantic models
│   │   │
│   │   └── core/
│   │       └── config.py     # Configuración
│   │
│   └── requirements.txt
│
└── README.md
```

## 🔧 Stack Tecnológico

### Frontend
| Tecnología | Uso |
|------------|-----|
| **Next.js 15** | Framework React con App Router |
| **React 19** | UI Library |
| **TypeScript** | Type safety |
| **TailwindCSS** | Estilos utilitarios |
| **Zustand** | State management |
| **React Query** | Server state & caching |
| **Recharts** | Gráficos y visualizaciones |
| **AG-Grid** | Grilla de opciones profesional |
| **Lucide React** | Iconografía |

### Backend
| Tecnología | Uso |
|------------|-----|
| **FastAPI** | Framework async Python |
| **Python 3.13** | Runtime |
| **py_vollib** | Cálculo de IV y Greeks |
| **httpx** | Cliente HTTP async |
| **Pydantic** | Validación de datos |
| **cachetools** | Caché en memoria |

### APIs Externas
- **data912.com/live/arg_stocks** - Precios de acciones en tiempo real
- **data912.com/live/arg_options** - Cadena de opciones en tiempo real

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+
- Python 3.11+
- npm o yarn

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno (Windows)
.\venv\Scripts\activate

# Activar entorno (Linux/Mac)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install --legacy-peer-deps

# Iniciar servidor de desarrollo
npm run dev
```

### Acceder a la aplicación
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs

## 📡 API Endpoints

### GET `/api/v1/chain/{ticker}`
Obtiene la cadena de opciones para un ticker.

**Parámetros:**
- `ticker`: Símbolo del subyacente (GGAL, YPF, PAMP, etc.)
- `days_to_expiry`: Días hasta vencimiento (default: 30)

**Response:**
```json
{
  "ticker": "GGAL",
  "spot_price": 8285.0,
  "timestamp": "2025-12-25T10:30:00",
  "days_to_expiry": 30,
  "chain": [
    {
      "strike": 8600,
      "call_bid": 428.4,
      "call_ask": 450.0,
      "call_delta": 0.4865,
      "call_iv": 0.5157,
      "call_gamma": 0.0008,
      "call_theta": -12.5,
      "call_vega": 8.2,
      "put_bid": 120.0,
      "put_ask": 150.0,
      "put_delta": -0.5135,
      "put_iv": 0.5200
    }
  ]
}
```

### GET `/api/v1/health`
Health check del servicio.

## 🧮 Fórmulas Implementadas

### Black-Scholes
```
d1 = [ln(S/K) + (r + σ²/2)T] / (σ√T)
d2 = d1 - σ√T

Call = S·N(d1) - K·e^(-rT)·N(d2)
Put  = K·e^(-rT)·N(-d2) - S·N(-d1)
```

Donde:
- **S** = Precio spot del subyacente
- **K** = Strike price
- **r** = Tasa libre de riesgo (26% para Argentina)
- **σ** = Volatilidad implícita
- **T** = Tiempo al vencimiento (en años)
- **N(x)** = Función de distribución normal acumulada

### Greeks
| Greek | Fórmula | Interpretación |
|-------|---------|----------------|
| **Delta (Δ)** | ∂V/∂S | Cambio en precio por $1 de cambio en subyacente |
| **Gamma (Γ)** | ∂²V/∂S² | Cambio en delta por $1 de cambio en subyacente |
| **Theta (Θ)** | ∂V/∂t | Decaimiento diario del valor temporal |
| **Vega (ν)** | ∂V/∂σ | Cambio en precio por 1% de cambio en IV |
| **Rho (ρ)** | ∂V/∂r | Sensibilidad a cambios en tasa de interés |

### Payoff al Vencimiento
```
Long Call:  max(0, S - K) × qty × 100 - Premium
Short Call: Premium - max(0, S - K) × qty × 100
Long Put:   max(0, K - S) × qty × 100 - Premium
Short Put:  Premium - max(0, K - S) × qty × 100
```

## ⚙️ Configuración

### Variables de Entorno

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** (`app/core/config.py`):
```python
default_risk_free_rate = 0.26  # 26% tasa Argentina
cache_ttl_seconds = 20         # Cache de datos de mercado
market_data_base_url = "https://data912.com"
```

## 🎮 Guía de Uso

### 1. Seleccionar Ticker
Elige el subyacente: GGAL, YPF, PAMP, ALUA, etc.

### 2. Ver Option Chain
La grilla muestra calls y puts organizados por strike:
- **Columnas izquierda**: Calls (Bid, Ask, Delta, IV, Volumen)
- **Columna central**: Strike
- **Columnas derecha**: Puts (IV, Delta, Bid, Ask, Volumen)

### 3. Construir Estrategia
- Click en **Bid** para VENDER (Short)
- Click en **Ask** para COMPRAR (Long)
- Cada click agrega un leg a la estrategia

### 4. Ajustar Cantidad
Usa los botones +/- para cambiar la cantidad de contratos por leg.

### 5. Analizar
Click en **"Analyze Strategy"** para ver el dashboard completo con:
- Gráfico de payoff
- Tabla de sensibilidad
- Métricas de riesgo/reward

### Estrategias Soportadas
| Estrategia | Composición |
|------------|-------------|
| **Long Call** | +1 Call |
| **Long Put** | +1 Put |
| **Covered Call** | +Stock, -1 Call OTM |
| **Protective Put** | +Stock, +1 Put OTM |
| **Bull Call Spread** | +1 Call ITM, -1 Call OTM |
| **Bear Put Spread** | +1 Put ITM, -1 Put OTM |
| **Straddle** | +1 Call ATM, +1 Put ATM |
| **Strangle** | +1 Call OTM, +1 Put OTM |
| **Iron Condor** | Bear Call Spread + Bull Put Spread |
| **Butterfly** | +1 Call ITM, -2 Calls ATM, +1 Call OTM |

## 🐛 Troubleshooting

### "Datos Zombis" (valores constantes después de cambios)
Presiona el botón rojo **"Fix Glitches (Reset)"** para limpiar localStorage/sessionStorage y reiniciar.

### Gráficos no se muestran
Los warnings de Recharts sobre `width(-1)` son de contenedor. Asegúrate que la ventana tenga tamaño adecuado.

### Greeks muestran 0 o NaN
1. Verifica que el backend esté corriendo (`http://localhost:8000/docs`)
2. Revisa que la API de data912.com esté accesible
3. Confirma que hay opciones con bid/ask > 0

### Error CORS
Verifica que el backend tenga habilitado CORS para `http://localhost:3000`.

## 📊 Screenshots

### Option Chain Grid
```
╔═══════════════════════════════════════════════════════════════╗
║  CALLS                    │ STRIKE │              PUTS        ║
║─────────────────────────────────────────────────────────────────║
║  Bid   Ask   Δ     IV    │  8000  │  IV    Δ     Bid   Ask   ║
║  500   520  0.62  45.2%  │  8200  │ 42.1% -0.38  180   195   ║
║  320   340  0.48  48.7%  │  8400  │ 47.3% -0.52  290   310   ║
║  185   200  0.35  51.2%  │  8600  │ 50.8% -0.65  420   445   ║
╚═══════════════════════════════════════════════════════════════╝
```

### Strategy Panel
```
╔═════════════════════════════════════╗
║  📊 Strategy Builder                ║
╠═════════════════════════════════════╣
║  Leg 1: Long Call 8400 @ $340  x1   ║
║  Leg 2: Short Call 8600 @ $185 x1   ║
╠═════════════════════════════════════╣
║  Net Cost: $155 ($15,500 total)     ║
║  Net Delta: +0.13                   ║
╠═════════════════════════════════════╣
║  [Analyze Strategy] [Clear All]     ║
╚═════════════════════════════════════╝
```

## 📁 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| `frontend/utils/blackScholes.ts` | Motor completo de Black-Scholes |
| `frontend/utils/strategyMath.ts` | Cálculos de payoff y métricas |
| `frontend/store/strategyStore.ts` | Estado global con Zustand |
| `backend/app/services/market_data.py` | Parser de datos de mercado |
| `backend/app/services/greeks.py` | Cálculos de Greeks con py_vollib |

## 🔄 Flujo de Datos

```
data912.com API
      │
      ▼
┌─────────────┐
│   FastAPI   │  ← market_data.py parsea y normaliza
│   Backend   │  ← greeks.py calcula IV
└──────┬──────┘
       │ JSON
       ▼
┌─────────────┐
│   Next.js   │  ← api_client.ts fetch
│   Frontend  │  ← strategyStore.ts estado
└──────┬──────┘
       │ Props
       ▼
┌─────────────┐
│ Components  │  ← blackScholes.ts cálculos
│  Analysis   │  ← sensitivity.ts tablas
└─────────────┘
```

## 📝 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles.

## 👤 Autor

**Pablo Kaegi** - [@pablokaegi](https://github.com/pablokaegi)

## 🙏 Agradecimientos

- [data912.com](https://data912.com) por la API de datos de mercado argentino
- [py_vollib](https://github.com/vollib/py_vollib) por la implementación de Black-Scholes
- [AG Grid](https://www.ag-grid.com/) por la grilla profesional
- [Recharts](https://recharts.org/) por las visualizaciones

---

<p align="center">
  Made with ❤️ for Argentine traders 🇦🇷
</p>
