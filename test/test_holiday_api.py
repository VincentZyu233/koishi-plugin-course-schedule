import urllib.request
import json
from datetime import datetime

G = "\033[92m"
Y = "\033[93m"
R = "\033[91m"
C = "\033[96m"
N = "\033[0m"
B = "\033[1m"

test_dates = [
    ("2026-01-01", "元旦"),
    ("2026-01-04", "元旦后补班"),
    ("2026-02-17", "春节初一"),
    ("2026-02-14", "春节前补班"),
    ("2026-03-15", "普通周日"),
    ("2026-04-05", "清明节"),
    ("2026-05-01", "劳动节"),
    ("2026-05-09", "劳动节后补班"),
    ("2026-07-20", "普通周一"),
    ("2026-10-01", "国庆节"),
]

WEEKDAY_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

url = "https://timor.tech/api/holiday/year/2026"
print(f"{B}{C}>>>{N} 请求: {url}")
req = urllib.request.Request(
    url,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
)
resp = urllib.request.urlopen(req, timeout=15)
data = json.loads(resp.read().decode())
code = data.get("code")
print(f"{B}{C}>>>{N} 状态码: {G if code == 0 else R}{code}{N}\n")

holidays = data.get("holiday", {})

print(f"{B}{'日期':<12} {'星期':<6} {'节日名称':<12} {'类型':<16}{N}")
print(f"{B}{'-' * 48}{N}")
for date_str, note in test_dates:
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    weekday = WEEKDAY_CN[dt.weekday()]
    entry = holidays.get(date_str[5:])
    if entry:
        name = entry.get("name", "")
        if entry.get("holiday") is True:
            t = f"{G}🎉 节假日{N}"
        elif entry.get("holiday") is False:
            t = f"{Y}🔄 调休上班日{N}"
        else:
            t = f"{R}❓ 未知{N}"
        print(f"{date_str:<12} {weekday:<6} {name:<12} {t}")
    else:
        print(f"{date_str:<12} {weekday:<6} {'—':<12} {'➖ 普通日期'}")
