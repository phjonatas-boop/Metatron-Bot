import time
import pandas as pd
from binance.client import Client

API_KEY = 'jVFkmmqCmn0EGpSG6ohLqdhzMLazterebhKpARb5i4TbSLi1AcHxMuyOY8cd2Joo'
API_SECRET = 'Dj84ulEyEPNq7dLEYBxuRKO2QVpRF4XAjbbYQ2u1tnKdqgynL9t39ZvUKzW4e173'
MODO = 'DEMO' # Mude para 'REAL' para operar

client = Client(API_KEY, API_SECRET)

def analisar_completo():
    try:
        # Puxa H1 (Macro) e M15 (Gatilho)
        h1 = client.get_klines(symbol='BTCUSDT', interval='1h', limit=20)
        m15 = client.get_klines(symbol='BTCUSDT', interval='15m', limit=50)
        
        df_h1 = pd.DataFrame(h1, columns=['t','o','h','l','c','v','t2','q2','t3','q3','t4','t5'])
        df_m15 = pd.DataFrame(m15, columns=['t','o','h','l','c','v','t2','q2','t3','q3','t4','t5'])
        
        preço = float(df_m15['c'].iloc[-1])
        # Quebra de Estrutura (BOS): Rompeu o maior topo dos últimos 10 candles
        topo_anterior = df_m15['h'].astype(float).iloc[-10:-1].max()
        fundo_origem = df_m15['l'].astype(float).iloc[-15:].min() # Stop na Origem
        
        direção_h1 = "ALTA" if float(df_h1['c'].iloc[-1]) > float(df_h1['o'].iloc[-5]) else "BAIXA"
        
        if preço > topo_anterior and direção_h1 == "ALTA":
            return "COMPRA (BOS)", fundo_origem
        return "AGUARDAR", None
    except Exception as e:
        return f"ERRO: {e}", None

print(f"🚀 TRON ENGINE V7 - MODO: {MODO}")
while True:
    status, sl = analisar_completo()
    print(f"[{time.strftime('%H:%M:%S')}] BTC: {status} | SL Origem: {sl}")
    time.sleep(60)
