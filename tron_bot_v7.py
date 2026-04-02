import time
import pandas as pd
from binance.client import Client

K1 = 'jVFkmmqCmn0EGpSG6ohLqdhzMLazterebhKpARb5i4TbSLi1AcHxMuyOY8cd2Joo'
K2 = 'Dj84ulEyEPNq7dLEYBxuRKO2QVpRF4XAjbbYQ2u1tnKdqgynL9t39ZvUKzW4e173'
client = Client(K1, K2)

def check():
    try:
        h1 = client.get_klines(symbol='BTCUSDT', interval='1h', limit=20)
        m15 = client.get_klines(symbol='BTCUSDT', interval='15m', limit=50)
        df_h1 = pd.DataFrame(h1, columns=['t','o','h','l','c','v','t2','q2','t3','q3','t4','t5'])
        df_m15 = pd.DataFrame(m15, columns=['t','o','h','l','c','v','t2','q2','t3','q3','t4','t5'])
        px = float(df_m15['c'].iloc[-1])
        topo = df_m15['h'].astype(float).iloc[-10:-1].max()
        fundo = df_m15['l'].astype(float).iloc[-15:].min()
        trend = "ALTA" if float(df_h1['c'].iloc[-1]) > float(df_h1['o'].iloc[-5]) else "BAIXA"
        if px > topo and trend == "ALTA":
            return "COMPRA", fundo
        return "AGUARDAR", None
    except: return "ERRO", None

print("TRON V7 ATIVO")
while True:
    s, sl = check()
    print(f"[{time.strftime('%H:%M:%S')}] BTC: {s} | SL: {sl}")
    time.sleep(60)
