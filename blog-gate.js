/* 블로그 경유 게이트 — 연락처·가격만 잠근다 (2026-08-20 형 지시 "3번")
 *
 * 설계 원칙:
 *  - 지역·포인트·수중환경·샵 이름·리뷰수는 그대로 공개 → 검색 색인 유지
 *    (08-14 색인 0건 수리 작업을 무효화하지 않기 위함)
 *  - 전화번호·가격만 가린다 → 실제 가치는 블로그 독자에게만
 *  - 검색 크롤러는 통과시킨다 → cloaking 판정 회피(사람에게도 같은 HTML을 주고,
 *    표시 여부만 클라이언트에서 바꾼다. 서버가 다른 내용을 주는 게 아님)
 *
 * 통과 조건 (하나라도 참이면 열림):
 *  1) document.referrer 가 네이버 블로그 계열
 *  2) URL 에 ?k=<KEY> (블로그 배너 링크에 심는다)
 *  3) 과거에 1·2로 통과한 적 있음(localStorage)
 *  4) 크롤러 UA (검색 색인용)
 */
(function () {
  "use strict";

  var KEY = "dive2026";                 // 블로그 링크에 붙일 키
  var STORE = "lm_blog_ok";
  var ALLOW_REF = /(^|\.)blog\.naver\.com|(^|\.)m\.blog\.naver\.com|(^|\.)naver\.me/i;
  var BOT = /bot|crawler|spider|slurp|yeti|daum|facebookexternalhit|embedly|preview/i;

  function passed() {
    try {
      if (localStorage.getItem(STORE) === "1") return true;
    } catch (e) {}

    // 크롤러는 항상 통과 — 색인 유지가 목적
    if (BOT.test(navigator.userAgent || "")) return true;

    // 토큰
    try {
      var p = new URLSearchParams(location.search);
      if (p.get("k") === KEY) {
        try { localStorage.setItem(STORE, "1"); } catch (e) {}
        return true;
      }
    } catch (e) {}

    // 리퍼러
    var ref = document.referrer || "";
    if (ref) {
      try {
        var h = new URL(ref).hostname;
        if (ALLOW_REF.test(h)) {
          try { localStorage.setItem(STORE, "1"); } catch (e) {}
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  if (passed()) return;

  // ── 여기부터: 통과 못 한 방문자에게 연락처·가격을 가린다 ──
  var BLOG = "https://blog.naver.com/karmalis";

  function maskPhones(root) {
    // 텍스트 노드에서 전화번호 패턴만 치환 (구조는 건드리지 않는다)
    var re = /(01[016789]|0\d{1,2}|050\d)[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var hits = [], n;
    while ((n = w.nextNode())) {
      if (re.test(n.nodeValue)) { re.lastIndex = 0; hits.push(n); }
    }
    hits.forEach(function (t) {
      t.nodeValue = t.nodeValue.replace(re, "0**-***-****");
    });
  }

  function lockPrices() {
    var lists = document.querySelectorAll("ul.price");
    lists.forEach(function (ul) {
      var cnt = ul.querySelectorAll("li").length;
      var box = document.createElement("div");
      box.className = "lm-locked";
      box.innerHTML =
        '<span class="lm-lock-ico">🔒</span> 가격 ' + cnt + '건 · ' +
        '<a href="' + BLOG + '" rel="noopener">블로그에서 보기</a>';
      ul.parentNode.replaceChild(box, ul);
    });
  }

  function banner() {
    var b = document.createElement("div");
    b.className = "lm-gate-note";
    b.innerHTML =
      '<strong>연락처 · 가격은 블로그 독자에게만 공개합니다</strong>' +
      '<span>「다이브 위키피디아」에서 이 지도로 들어오시면 모두 보입니다.</span>' +
      '<a href="' + BLOG + '" rel="noopener">블로그 바로가기 →</a>';
    var m = document.querySelector("main") || document.body;
    m.insertBefore(b, m.firstChild);
  }

  function style() {
    var s = document.createElement("style");
    s.textContent =
      ".lm-gate-note{background:#0f4c5c;color:#fff;border-radius:12px;padding:14px 16px;margin:0 0 18px;font-size:14.5px;line-height:1.6}" +
      ".lm-gate-note strong{display:block;font-size:15.5px;margin-bottom:4px}" +
      ".lm-gate-note span{display:block;color:rgba(255,255,255,.82);font-size:13.5px}" +
      ".lm-gate-note a{display:inline-block;margin-top:8px;background:#e8b04b;color:#5c3f0a;font-weight:700;text-decoration:none;padding:7px 14px;border-radius:8px;font-size:13.5px}" +
      ".lm-locked{background:var(--bg,#f6f3ec);border:1px dashed var(--line,#e2ddd0);border-radius:9px;padding:9px 12px;margin:8px 0;font-size:14px;color:var(--soft,#5c6f73)}" +
      ".lm-locked a{color:var(--navy,#0a2e3d);font-weight:600}" +
      ".lm-lock-ico{margin-right:4px}";
    document.head.appendChild(s);
  }

  function run() {
    style();
    maskPhones(document.body);
    lockPrices();
    banner();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
