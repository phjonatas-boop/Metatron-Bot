import time
import pandas as pd
from binance.client import Client

API_KEY = 'jVFkmmqCmn0EGpSG6ohLqdhzMLazterebhKpARb5i4TbSLi1AcHxMuyOY8cd2Joo'
API_SECRET = 'Dj84ulEyEPNq7dLEYBxuRKO2QVpRF4XAjbbYQ2u1tnKdqgynL9t39ZvUKzW4e173'
MODO = 'DEMO' 

client = Client(API_KEY, API_SECRET)

def analisar():
    try:
        h1 = client.get_klines(symbol='BTCUSDT', interval='1h', limit=20)
        m15 = client.get_klines(symbol='BTCUSDT', interval='15m', limit=50)
        df_h1 = pd.DataFrame(h1, columns=['t','o','h','l','c','v','t2','q2','t3','q3','t4','t5'])
        df_m15 = pd.DataFrame(m15, columns=['t','o','h','l','c','v','t2','q2','t3','q3','t4','t5'])
        preço = float(df_m15['c'].iloc[-1])
        topo_h1 = df_h1['h'].astype(float).iloc[-10:-1].max()
        fundo_m15 = df_m15['l'].astype(float).iloc[-15:].min()
        if preço > topo_h1:
            return "COMPRA", fundo_m15
        return "AGUARDAR", None
    except: return "ERRO", None

print("🚀 METATRON V7 ATIVADO...")
while True:
    st, sl = analisar()
    print(f"[{time.strftime('%H:%M:%S')}] Status: {st} | SL na Origem: {sl}")
    time.sleep(60)
