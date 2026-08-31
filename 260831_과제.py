import pandas as pd
import matplotlib.pyplot as plt
from matplotlib import font_manager


# ══════════════════════════════════════════════════════════════════════
# 0. 환경 설정 — 수정하지 마세요
# ══════════════════════════════════════════════════════════════════════
INK, BODY, MUTED = '#0c0a09', '#4e4e4e', '#777169'
HAIR, GRAY, GRAY_D = '#d6d3d1', '#c9c5c1', '#a8a29e'
ACCENT, WARN = '#2f6f5e', '#c2543d'

def setup_font():
    '''설치된 한글 폰트를 자동으로 찾아 적용한다.'''
    candidates = [
        'Malgun Gothic',       # Windows
        'AppleGothic',         # macOS
    ]
    installed = {f.name for f in font_manager.fontManager.ttflist}
    for name in candidates:
        if name in installed:
            plt.rcParams['font.family'] = name
            break
    else:
        print('[경고] 한글 폰트를 찾지 못했습니다. 라벨이 □로 보일 수 있습니다.\n'
              '       Colab: !apt-get install -y fonts-nanum 후 런타임 재시작')
    plt.rcParams.update({
        'axes.unicode_minus': False,   # 음수 부호 깨짐 방지
    })

def save(fig, path):
    fig.savefig(path, bbox_inches='tight')
    plt.close(fig)


# ══════════════════════════════════════════════════════════════════════
# 1. 데이터 — 수정하지 마세요
# ══════════════════════════════════════════════════════════════════════
def load_data():
    '''가입 월별 신규 가입자 수와 3개월 유지율 (2025년 12개월)
    '''
    return pd.DataFrame({
        '가입월': pd.date_range('2025-01-01', periods=12, freq='MS'),
        '3개월유지율': [71.0, 70.0, 69.0, 68.0, 66.0, 64.0,
                        61.0, 59.0, 57.0, 56.0, 55.0, 54.0],
        '신규가입자': [8200, 8600, 9100, 9400, 10200, 11800,
                       13500, 14100, 13800, 13200, 12600, 12100],
    })

SOURCE_NOTE = ('자료: 구독 관리 DB · 기간 2025.01~2025.12 · '
               'N=신규 가입 137,600명 · 단위 %')

# ══════════════════════════════════════════════════════════════════════
# 2. 여기부터 작성하세요
# ══════════════════════════════════════════════════════════════════════
def my_answer():
    df = load_data()
    x = df['가입월']
    y = df['3개월유지율']

    fig, ax = plt.subplots(figsize=(8.6, 4.7))
    fig.subplots_adjust(top=0.82, bottom=0.15, left=0.08, right=0.92)
    
    # ── R1. 선 그래프 ─────────────────────────────────────────────
    # TODO: ax.plot(...) linewidth
    # 선과 두께 지정
    ax.plot(x, y, color=WARN, linewidth=3, zorder=3)
    
    # ── R2. 기준선 ────────────────────────────────────────────────
    # TODO: 연초 값에 가로 점선을 긋고 라벨을 답니다.
    #       힌트: ax.axhline(...) / ax.text()
    # 연초 값(71%) 가로 점선 및 선 위에 텍스트 표기
    baseline_val = y.iloc[0]
    ax.axhline(baseline_val, color=GRAY_D, linestyle='--', linewidth=1, zorder=2)
    ax.text(x.iloc[0], baseline_val + 0.4, "연초 71%", 
            va='bottom', ha='left', fontsize=9, color=GRAY_D)
    
    # ── R3. 낙폭 음영 ─────────────────────────────────────────────
    # TODO: 기준선과 실제 선 사이를 채웁니다.
    # 실제 선과 기준선 사이를 옅은 투명도의 색상으로 채움
    ax.fill_between(x, y, baseline_val, color=WARN, alpha=0.06, zorder=1)
    
    # ── R4. 마지막 값 직접 라벨링 ─────────────────────────────────
    # TODO: 마지막 점을 찍고 그 아래에 '54%' 를 표기합니다.
    #       힌트: ax.scatter()
    # 추가로, 낙폭을 화살표로 표현 (ax.annotate(arrowprops) 활용)
    last_x = x.iloc[-1]
    last_y = y.iloc[-1]
    
    # 마지막 지점 데이터 점 표시 및 바로 아래에 수치 라벨링
    ax.scatter(last_x, last_y, color=WARN, s=60, zorder=5)
    ax.text(last_x, last_y - 1.2, f"{int(last_y)}%", 
            ha='center', va='top', fontsize=11, color=WARN, fontweight='bold')
    
    # [양방향 화살표 기능 추가]
    ax.annotate('', 
                xy=(last_x, last_y + 0.4), 
                xytext=(last_x, baseline_val - 0.4),
                arrowprops=dict(arrowstyle="<->", color=INK, lw=1, ls='-'),
                zorder=4)
    
    # 화살표의 오른쪽에 간격을 맞춰 낙폭 수치 추가
    import pandas as pd
    ax.text(last_x + pd.Timedelta(days=8), (baseline_val + last_y) / 2, "-17%p", 
            color=INK, ha="left", va="center", fontsize=10)

    # ── R5. 차트 정크 제거 ────────────────────────────────────────
    # TODO: 왼쪽 제외 축선을 지우고 y축 눈금을 [50, 60, 70] 으로 제한합니다.
    #       힌트: ax.spines[side].set_visible(False) side = top, right, bottom, left
    #             ax.set_yticks(); ax.set_ylim()
    # 위, 오른쪽, 아래 축 테두리 제거 (왼쪽 축선만 옅게 유지)
    for side in ['top', 'right', 'bottom']:
        ax.spines[side].set_visible(False)
    ax.spines['left'].set_color(HAIR)
    
    # y축 눈금을 3개([50, 60, 70])로 명확하게 제한 및 범위 설정
    ax.set_yticks([50, 60, 70])
    ax.set_yticklabels(['50', '60', '70'], color=MUTED, fontsize=9)
    ax.set_ylim(45, 74)

    # x축 레이블 설정 (격월 간격 및 날짜 포맷 적용)
    ax.set_xticks(x[::2], [t.strftime('%y-%m') for t in x[::2]], fontsize=9)
    ax.tick_params(length=0, colors=MUTED)

    # ── R6. Action Title ──────────────────────────────────────────
    # TODO: 아래 제목을 결론 문장으로 바꾸고, 부제를 추가하세요.
    # plt.suptitle("신규 가입자의 3개월 유지율이 연초 대비 연말에 17%p 지속 하락했습니다.", 
    #              fontsize=12, fontweight='bold', ha='left', x=0.05, y=0.96)
    # 결론 문장을 대제목으로 배치하고, 그 아래 부제 텍스트 추가
    ax.set_title("3개월 유지율이 1년 만에 71% → 54%로 17%p 하락했다", 
                 fontsize=15, color=INK, loc='left', pad=28, fontweight='bold')
    ax.text(0.0, 1.05, "가입 월별 3개월 유지율 · 2025년", 
            fontsize=10, color=MUTED, transform=ax.transAxes)

    # ── R7. 메타 정보 ─────────────────────────────────────────────
    # TODO: 메타정보(SOURCE_NOTE)를 추가해주세요
    # 하단 레이아웃 영역에 메타 캡션 정보를 할당
    plt.figtext(0.05, 0.04, SOURCE_NOTE, fontsize=8, color=GRAY_D, ha='left')

    return fig

# ══════════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    setup_font()

    save(my_answer(), '과제1.png')



# ════════════════════════════  문제 구분  ══════════════════════════════════════════


import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib import font_manager

# ══════════════════════════════════════════════════════════════════════
# 0. 환경 설정 — 수정하지 마세요
# ══════════════════════════════════════════════════════════════════════
INK, BODY, MUTED = '#0c0a09', '#4e4e4e', '#777169'
HAIR, GRAY, GRAY_D = '#d6d3d1', '#c9c5c1', '#a8a29e'
ACCENT, WARN = '#2f6f5e', '#c2543d'

def setup_font():
    '''설치된 한글 폰트를 자동으로 찾아 적용한다.'''
    candidates = [
        'Malgun Gothic',       # Windows
        'AppleGothic',         # macOS
    ]
    installed = {f.name for f in font_manager.fontManager.ttflist}
    for name in candidates:
        if name in installed:
            plt.rcParams['font.family'] = name
            break
    else:
        print('[경고] 한글 폰트를 찾지 못했습니다. 라벨이 □로 보일 수 있습니다.\n'
              '       Colab: !apt-get install -y fonts-nanum 후 런타임 재시작')
    plt.rcParams.update({
        'axes.unicode_minus': False,   # 음수 부호 깨짐 방지
    })

def save(fig, path):
    fig.savefig(path, bbox_inches='tight')
    plt.close(fig)

# ══════════════════════════════════════════════════════════════════════
# 1. 데이터 — 수정하지 마세요
# ══════════════════════════════════════════════════════════════════════
def load_data():
    '''가입 후 경과 기간별 이탈 비중.
    '''
    return pd.DataFrame({
        '가입후경과': ['1개월 내', '1~3개월', '3~6개월', '6~12개월', '12개월 이상'],
        '이탈비중': [23.0, 28.0, 19.0, 17.0, 13.0],
    })


EARLY = ['1개월 내', '1~3개월']        # 강조할 초기 구간
SOURCE_NOTE = ('자료: 구독 관리 DB · 기간 2025.01~2025.12 · '
               'N=이탈 고객 41,300명 · 단위 %')


# ══════════════════════════════════════════════════════════════════════
# 2. 여기부터 작성하세요
# ══════════════════════════════════════════════════════════════════════
def my_answer():
    df = load_data()

    # 가로 막대는 아래에서 위로 쌓이므로, 시간 순서를 위→아래로 보이게 하려면
    # 데이터를 뒤집어야 합니다. (R2 — 정렬이 아니라 순서 유지)
    d = df.iloc[::-1].reset_index(drop=True)
    y = np.arange(len(d))

    fig, ax = plt.subplots(figsize=(8.6, 4.3))
    fig.subplots_adjust(top=0.82, bottom=0.15, left=0.15, right=0.85)

    # ── R3. 회색조 + 강조 1색 ─────────────────────────────────────
    # TODO: 초기 두 구간(EARLY)만 WARN, 나머지는 GRAY 로 색을 정하세요.
    colors = [WARN if val in EARLY else GRAY for val in d['가입후경과']]

    # ── R1. 가로 막대 ─────────────────────────────────────────────
    # TODO: ax.barh() height: 0.62
    bars = ax.barh(y, d['이탈비중'], height=0.62, color=colors, zorder=3)

    # ── R4. 직접 라벨링 ───────────────────────────────────────────
    # TODO: 막대 끝에 값을 표기하세요.
    for bar, val, label in zip(bars, d['이탈비중'], d['가입후경과']):
        width = bar.get_width()
        text_color = WARN if label in EARLY else GRAY_D
        ax.text(width + 0.8, bar.get_y() + bar.get_height()/2, f"{int(val)}%", 
                va='center', ha='left', fontsize=11, color=text_color, fontweight='bold' if label in EARLY else 'normal')

    # ── R4. x축 눈금 제거 + 정크 정리 ─────────────────────────────
    # TODO: 축선 4개를 모두 지우고 x축 눈금을 없애세요. (limit 0 ~ 40)
    for side in ['top', 'right', 'bottom', 'left']:
        ax.spines[side].set_visible(False)
    
    ax.set_xticks([])
    ax.set_xlim(0, 40)

    # ── R5. 주석 ──────────────────────────────────────────────────
    # TODO: '초기 3개월에\n51% 집중' 을 화살표와 함께 답니다.
    #       힌트: ax.annotate(arrowprops={connectionstyle: ???})
    target_y = 3
    target_x = d.loc[target_y, '이탈비중'] # 28.0
    
    ax.annotate('초기 3개월에\n51% 집중', 
                xy=(target_x + 4.5, target_y + 0.2),  # 화살표 촉이 가리킬 막대 모서리 부근
                xytext=(target_x + 10, target_y - 0.5), # 텍스트가 시작될 위치
                arrowprops=dict(arrowstyle="->", 
                                color=WARN, 
                                lw=1.2, 
                                connectionstyle="arc3,rad=-0.2"), # 바깥으로 살짝 휘어지는 곡선
                color=WARN, 
                fontsize=10.5, 
                va='center', 
                ha='left',
                linespacing=1.3)

    # 축 라벨 (참고용)
    ax.set_yticks(y)
    ax.set_yticklabels(d['가입후경과'], fontsize=11, color=INK)
    ax.tick_params(axis='y', length=0)


    # ── R6. Action Title ──────────────────────────────────────────
    # TODO: 아래 제목을 결론 문장으로 바꾸고, 부제를 추가하세요.
    ax.set_title("이탈의 51%가 가입 후 3개월 안에 발생한다", 
                 fontsize=16, color=INK, loc='left', pad=28, fontweight='bold')
    ax.text(0.0, 1.05, "가입 후 경과 기간별 이탈 비중", 
            fontsize=9, color=MUTED, transform=ax.transAxes)

    # ── R7. 메타 정보 ─────────────────────────────────────────────
    # TODO: 메타정보(SOURCE_NOTE)를 추가해주세요
    plt.figtext(0.05, 0.04, SOURCE_NOTE, fontsize=8, color=GRAY_D, ha='left')

    return fig

if __name__ == '__main__':
    setup_font()

    save(my_answer(), '과제2.png')
