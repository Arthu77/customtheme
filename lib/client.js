window.__ModuleLoader__.load({
  id: "customtheme",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var React = require("react");

    exports.inject = ["slots", "theme"];

    exports.apply = function apply(ctx) {
      const DEFAULTS = {
        image: null, opacity: 0.6,
        brand: null, tint: null, auto: true, derived: null,
        composerBg: null, composerAlpha: 0.9, composerBorder: null,
        bubbleBg: null, bubbleAlpha: 0.95,
        labelPrimary: null, labelSecondary: null, borderColor: null,
        sidebarAlpha: 0.5,
        bodyFontKey: '', bodyCustom: null, codeFontKey: '', codeCustom: null,
      }
      const STORAGE_KEY = 'customtheme:state'
      function loadState() {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY)
          if (!raw) return { ...DEFAULTS }
          return { ...DEFAULTS, ...JSON.parse(raw) }
        } catch (err) {
          return { ...DEFAULTS }
        }
      }
      function persistState(s) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
        } catch (err) {
          console.error('customtheme: persist failed', err)
        }
      }
      let state = loadState()
      const listeners = new Set()
      const setState = (patch) => {
        state = { ...state, ...patch }
        for (const l of listeners) l()
        applyTheme()
        applyCss()
        persistState(state)
      }
      const subscribe = (cb) => { listeners.add(cb); return () => listeners.delete(cb) }
      const getSnapshot = () => state

      function insertStyle(css) {
        const el = document.createElement('style')
        el.dataset.plugin = 'customtheme'
        el.textContent = css
        document.head.appendChild(el)
        return () => el.remove()
      }

      const DEFAULT_BODY_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
      const DEFAULT_CODE_STACK = "'SF Mono', 'JetBrains Mono', 'Fira Code', Consolas, Menlo, monospace"
      const BODY_FONTS = [
        { value: '', label: '默认（系统）', stack: null },
        { value: 'yahei', label: '微软雅黑', stack: "'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif" },
        { value: 'pingfang', label: '苹方', stack: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif" },
        { value: 'noto', label: '思源黑体', stack: "'Noto Sans SC', 'Source Han Sans SC', 'Microsoft YaHei', sans-serif" },
        { value: 'harmony', label: '鸿蒙黑体', stack: "'HarmonyOS Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif" },
        { value: 'mi', label: '小米兰亭', stack: "'MiSans', 'PingFang SC', 'Microsoft YaHei', sans-serif" },
        { value: 'segoe', label: 'Segoe UI', stack: "'Segoe UI', 'Microsoft YaHei', 'PingFang SC', sans-serif" },
        { value: 'helvetica', label: 'Helvetica Neue', stack: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
        { value: 'simsun', label: '宋体', stack: "'SimSun', 'Songti SC', serif" },
        { value: 'kaiti', label: '楷体', stack: "'KaiTi', 'STKaiti', 'Kaiti SC', serif" },
        { value: 'fangsong', label: '仿宋', stack: "'FangSong', 'STFangsong', 'FangSong SC', serif" },
      ]
      const CODE_FONTS = [
        { value: '', label: '默认（等宽）', stack: null },
        { value: 'sfmono', label: 'SF Mono', stack: "'SF Mono', Menlo, monospace" },
        { value: 'jetbrains', label: 'JetBrains Mono', stack: "'JetBrains Mono', Consolas, monospace" },
        { value: 'fira', label: 'Fira Code', stack: "'Fira Code', Consolas, monospace" },
        { value: 'cascadia', label: 'Cascadia Code', stack: "'Cascadia Code', Consolas, monospace" },
        { value: 'consolas', label: 'Consolas', stack: "Consolas, 'Courier New', monospace" },
        { value: 'mono', label: '通用等宽', stack: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
      ]

      // ---- color helpers ----
      function hexToRgb(hex) {
        const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim())
        if (!m) return { r: 128, g: 128, b: 128 }
        const n = parseInt(m[1], 16)
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
      }
      function rgbToHex(r, g, b) {
        const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
        return '#' + c(r) + c(g) + c(b)
      }
      function rgba(hex, alpha) {
        const { r, g, b } = hexToRgb(hex)
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')'
      }
      function mix(hex, other, t) {
        const a = hexToRgb(hex), b = hexToRgb(other)
        return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t)
      }
      function shade(hex, f) {
        const { r, g, b } = hexToRgb(hex)
        return rgbToHex(r * (1 + f), g * (1 + f), b * (1 + f))
      }
      function toHsl(c) {
        const rn = c.r / 255, gn = c.g / 255, bn = c.b / 255
        const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
        const l = (max + min) / 2
        let h = 0, s = 0
        if (max !== min) {
          const d = max - min
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
          if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
          else if (max === gn) h = ((bn - rn) / d + 2) / 6
          else h = ((rn - gn) / d + 4) / 6
        }
        return { h: h, s: s, l: l }
      }
      function fromHsl(hsl) {
        const hue = ((hsl.h % 1) + 1) % 1
        const q = hsl.l < 0.5 ? hsl.l * (1 + hsl.s) : hsl.l + hsl.s - hsl.l * hsl.s
        const p = 2 * hsl.l - q
        const f = (t) => {
          let k = (t + hue) % 1
          if (k < 0) k += 1
          if (k < 1 / 6) return p + (q - p) * 6 * k
          if (k < 1 / 2) return q
          if (k < 2 / 3) return p + (q - p) * (2 / 3 - k) * 6
          return p
        }
        return rgbToHex(f(0) * 255, f(1 / 3) * 255, f(2 / 3) * 255)
      }
      function brandFromRgb(c) {
        const { h, s, l } = toHsl(c)
        return fromHsl({ h: h, s: Math.max(s, 0.5), l: Math.max(0.32, Math.min(0.62, l)) })
      }
      function tintFromRgb(c) {
        const { l } = toHsl(c)
        return mix(rgbToHex(c.r, c.g, c.b), l > 0.5 ? '#f7f8fc' : '#0d0f17', 0.35)
      }

      // ---- image color extraction ----
      function extractColors(dataUrl) {
        return new Promise((resolve) => {
          const img = new Image()
          img.onload = () => {
            try {
              const size = 48
              const canvas = document.createElement('canvas')
              canvas.width = size
              canvas.height = size
              const g = canvas.getContext('2d')
              g.drawImage(img, 0, 0, size, size)
              const data = g.getImageData(0, 0, size, size).data
              const buckets = new Map()
              for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] < 128) continue
                const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4)
                const e = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 }
                e.r += data[i]; e.g += data[i + 1]; e.b += data[i + 2]; e.n += 1
                buckets.set(key, e)
              }
              let best = null, bestScore = -1
              for (const e of buckets.values()) {
                const r = e.r / e.n, g = e.g / e.n, b = e.b / e.n
                const max = Math.max(r, g, b), min = Math.min(r, g, b)
                const sat = max === 0 ? 0 : (max - min) / max
                const score = e.n * (0.5 + sat)
                if (score > bestScore) { bestScore = score; best = { r: r, g: g, b: b } }
              }
              resolve(best ? { brand: brandFromRgb(best), tint: tintFromRgb(best) } : null)
            } catch (err) {
              console.error(err)
              resolve(null)
            }
          }
          img.onerror = () => resolve(null)
          img.src = dataUrl
        })
      }
      function handleFile(file) {
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          const image = String(reader.result)
          setState({ image: image })
          if (state.auto) {
            extractColors(image).then((derived) => { if (derived) setState({ derived: derived }) })
          }
        }
        reader.readAsDataURL(file)
      }
      function handleFontFile(file, kind) {
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          const url = String(reader.result)
          if (kind === 'body') setState({ bodyCustom: { url: url, name: file.name } })
          else setState({ codeCustom: { url: url, name: file.name } })
        }
        reader.readAsDataURL(file)
      }

      // ---- effective colors & tokens ----
      function effectiveColors(s) {
        const brand = s.brand || (s.auto && s.derived ? s.derived.brand : null) || null
        const tint = s.tint || (s.auto && s.derived ? s.derived.tint : null) || null
        return { brand: brand, tint: tint }
      }
      function deriveDetails(s) {
        const { brand, tint } = effectiveColors(s)
        const tintDark = tint ? shade(tint, -0.5) : null
        const compLight = s.composerBg ? s.composerBg : (tint ? mix(tint, '#ffffff', 0.22) : null)
        const compDark = s.composerBg ? shade(s.composerBg, -0.4) : (tintDark ? mix(tintDark, '#000000', 0.25) : null)
        const bubbleLight = s.bubbleBg ? s.bubbleBg : (tint ? mix(tint, '#ffffff', 0.35) : null)
        const bubbleDark = s.bubbleBg ? shade(s.bubbleBg, -0.3) : (tintDark ? mix(tintDark, '#000000', 0.35) : null)
        return { brand: brand, tint: tint, tintDark: tintDark, compLight: compLight, compDark: compDark, bubbleLight: bubbleLight, bubbleDark: bubbleDark }
      }
      function buildTokens(s) {
        const d = deriveDetails(s)
        const tokens = {}
        if (d.brand) tokens['--dsw-alias-brand-primary'] = { light: d.brand, dark: d.brand }
        if (d.tint) {
          tokens['--dsw-alias-bg-base'] = { light: rgba(d.tint, 0.34), dark: rgba(d.tintDark, 0.46) }
          tokens['--dsw-alias-bg-layer-1'] = { light: rgba(d.tint, 0.6), dark: rgba(d.tintDark, 0.66) }
          tokens['--dsw-specific-sidebar-fill'] = { light: rgba(d.tint, s.sidebarAlpha), dark: rgba(d.tintDark, Math.min(1, s.sidebarAlpha + 0.08)) }
        }
        if (d.compLight) tokens['--dsw-specific-input-major'] = { light: rgba(d.compLight, s.composerAlpha), dark: rgba(d.compDark, Math.min(1, s.composerAlpha + 0.05)) }
        if (s.composerBorder) tokens['--dsw-alias-border-l2-darkmode-thin'] = { light: s.composerBorder, dark: s.composerBorder }
        if (d.bubbleLight) tokens['--dsw-specific-bubble'] = { light: rgba(d.bubbleLight, s.bubbleAlpha), dark: rgba(d.bubbleDark, Math.min(1, s.bubbleAlpha + 0.05)) }
        if (s.labelPrimary) tokens['--dsw-alias-label-primary'] = { light: s.labelPrimary, dark: s.labelPrimary }
        if (s.labelSecondary) tokens['--dsw-alias-label-secondary'] = { light: s.labelSecondary, dark: s.labelSecondary }
        if (s.borderColor) {
          tokens['--dsw-alias-border-l1'] = { light: s.borderColor, dark: s.borderColor }
          tokens['--dsw-alias-border-l2'] = { light: s.borderColor, dark: s.borderColor }
        }
        return tokens
      }
      let themeDisposer = null
      function applyTheme() {
        if (themeDisposer) { try { themeDisposer() } catch (err) { console.error(err) } themeDisposer = null }
        const tokens = buildTokens(state)
        if (Object.keys(tokens).length === 0) return
        themeDisposer = ctx.theme.overrideTokens('custom-theme', tokens)
      }
      let bgCssDisposer = null
      let fontCssDisposer = null
      let lastBgCss = ''
      let lastFontCss = ''
      function backgroundCss(s) {
        const scrim = rgba('#0a0c12', Math.max(0, Math.min(1, 1 - s.opacity)))
        return 'body{background-image:linear-gradient(' + scrim + ',' + scrim + '),url("' + s.image + '")!important;background-size:cover,cover!important;background-position:center,center!important;background-repeat:no-repeat,no-repeat!important;background-attachment:fixed,fixed!important}'
      }
      function fontFormat(name) {
        const n = String(name).toLowerCase()
        if (n.indexOf('.woff2') !== -1) return 'woff2'
        if (n.indexOf('.woff') !== -1) return 'woff'
        if (n.indexOf('.otf') !== -1) return 'opentype'
        return 'truetype'
      }
      function fontCss(s) {
        let css = ''
        if (s.bodyCustom) css += '@font-face{font-family:CTBody;src:url("' + s.bodyCustom.url + '") format("' + fontFormat(s.bodyCustom.name) + '");font-weight:100 900;font-style:normal;font-display:swap;}'
        if (s.codeCustom) css += '@font-face{font-family:CTCode;src:url("' + s.codeCustom.url + '") format("' + fontFormat(s.codeCustom.name) + '");font-weight:100 900;font-style:normal;font-display:swap;}'
        const bodyOpt = BODY_FONTS.find((f) => f.value === s.bodyFontKey)
        const codeOpt = CODE_FONTS.find((f) => f.value === s.codeFontKey)
        let bodyStack = null
        let codeStack = null
        if (s.bodyCustom) bodyStack = 'CTBody, ' + (bodyOpt && bodyOpt.stack ? bodyOpt.stack : DEFAULT_BODY_STACK)
        else if (bodyOpt && bodyOpt.stack) bodyStack = bodyOpt.stack
        if (s.codeCustom) codeStack = 'CTCode, ' + (codeOpt && codeOpt.stack ? codeOpt.stack : DEFAULT_CODE_STACK)
        else if (codeOpt && codeOpt.stack) codeStack = codeOpt.stack
        if (bodyStack) css += ':root{--dsw-font-family:' + bodyStack + '!important}'
        if (codeStack) css += ':root{--ds-font-family-code:' + codeStack + '!important}'
        if (bodyStack) css += 'body{font-family:var(--dsw-font-family)!important}'
        return css
      }
      function applyCss() {
        const bg = state.image ? backgroundCss(state) : ''
        if (bg !== lastBgCss) {
          lastBgCss = bg
          if (bgCssDisposer) { try { bgCssDisposer() } catch (err) { console.error(err) } bgCssDisposer = null }
          if (bg) bgCssDisposer = insertStyle(bg)
        }
        const fc = fontCss(state)
        if (fc !== lastFontCss) {
          lastFontCss = fc
          if (fontCssDisposer) { try { fontCssDisposer() } catch (err) { console.error(err) } fontCssDisposer = null }
          if (fc) fontCssDisposer = insertStyle(fc)
        }
      }
      function resetAll() {
        state = { ...DEFAULTS }
        applyTheme()
        applyCss()
        persistState(state)
        for (const l of listeners) l()
      }
      ctx.effect(() => () => {
        if (themeDisposer) themeDisposer()
        if (bgCssDisposer) bgCssDisposer()
        if (fontCssDisposer) fontCssDisposer()
      })

      // ---- UI primitives ----
      const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, minHeight: 32 }
      const labelStyle = { width: 110, flexShrink: 0, fontSize: 13, color: 'var(--dsw-alias-label-secondary)' }
      const inputStyle = { padding: '4px 8px', borderRadius: 6, border: '1px solid var(--dsw-alias-border-l1)', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)', fontSize: 13 }
      const small = { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }
      const ghostBtn = { ...inputStyle, cursor: 'pointer', borderColor: 'var(--dsw-alias-border-l2)', lineHeight: 1 }
      const sectionTitle = { fontSize: 13, fontWeight: 600, color: 'var(--dsw-alias-label-primary)', borderBottom: '1px solid var(--dsw-alias-border-l1)', paddingBottom: 6 }
      const Row = (...children) => React.createElement('div', { style: rowStyle }, ...children)
      const Section = (props) => React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        React.createElement('div', { style: sectionTitle }, props.title),
        props.children,
      )
      const SliderField = (props) => React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 } },
        React.createElement('input', { type: 'range', min: 0, max: 100, value: props.value, onChange: (e) => props.onChange(Number(e.target.value)), style: { flex: 1 } }),
        React.createElement('span', { style: { width: 44, textAlign: 'right', ...small } }, props.text),
      )
      const ColorField = (props) => React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 } },
        React.createElement('input', { type: 'color', value: props.value, onChange: (e) => props.onChange(e.target.value), style: { width: 42, height: 28, padding: 0, border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 6, background: 'transparent', cursor: 'pointer' } }),
        React.createElement('span', { style: { ...small, fontVariantNumeric: 'tabular-nums' } }, props.value),
        props.manual ? React.createElement('button', { onClick: props.onReset, title: '清除手动设置（回到自动/默认）', style: { ...ghostBtn, padding: '0 7px' } }, '✕') : null,
        React.createElement('span', { style: small }, props.hint),
      )
      const Select = (props) => React.createElement('select', { value: props.value, onChange: (e) => props.onChange(e.target.value), style: { ...inputStyle, flex: 1, minWidth: 0 } },
        props.options.map((o) => React.createElement('option', { key: o.value, value: o.value }, o.label)),
      )

      const Page = (props) => {
        const s = React.useSyncExternalStore(subscribe, getSnapshot)
        const d = deriveDetails(s)
        const fallback = '#8a93a6'
        const page = { display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 2px', maxWidth: 660 }
        const title = { fontSize: 15, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' }
        const desc = { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.6 }
        const preview = { height: 64, maxWidth: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--dsw-alias-border-l1)' }
        const swatches = []
        if (d.brand) swatches.push(['强调色', d.brand])
        if (d.tint) swatches.push(['背景色', d.tint])
        if (d.compLight) swatches.push(['输入框', d.compLight])
        if (d.bubbleLight) swatches.push(['气泡', d.bubbleLight])
        return React.createElement('div', { style: page },
          React.createElement('div', { style: title }, '自定义主题'),
          React.createElement('div', { style: desc }, '上传背景图后可调节图片/侧边栏透明度；开启自动配色后主题色从图片主色自动搭配。还支持自定义输入框、消息气泡、文字、边框以及界面/代码字体（系统字体或上传字体文件）。'),
          swatches.length ? React.createElement('div', { style: { display: 'flex', gap: 12, flexWrap: 'wrap' } }, swatches.map((it) =>
            React.createElement('span', { key: it[0], style: { display: 'inline-flex', alignItems: 'center', gap: 6, ...small } },
              React.createElement('span', { style: { width: 16, height: 16, borderRadius: 4, background: it[1], border: '1px solid var(--dsw-alias-border-l2)' } }),
              it[0],
            ),
          )) : null,
          React.createElement(Section, { title: '背景图片' },
            Row(React.createElement('div', { style: labelStyle }, '背景图片'),
              React.createElement('input', { type: 'file', accept: 'image/*', style: inputStyle, onChange: (e) => handleFile(e.target.files && e.target.files[0]) }),
            ),
            s.image ? React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
              React.createElement('img', { src: s.image, alt: 'background preview', style: preview }),
              React.createElement('button', { onClick: () => setState({ image: null }), style: ghostBtn }, '移除图片'),
            ) : null,
            Row(React.createElement('div', { style: labelStyle }, '图片不透明度'),
              React.createElement(SliderField, { value: Math.round(s.opacity * 100), text: String(Math.round(s.opacity * 100)) + '%', onChange: (v) => setState({ opacity: v / 100 }) }),
            ),
          ),
          React.createElement(Section, { title: '全局配色' },
            Row(React.createElement('input', { type: 'checkbox', id: 'ct-auto', checked: s.auto, onChange: (e) => {
              const auto = e.target.checked
              setState({ auto: auto })
              if (auto && s.image && !s.derived) extractColors(s.image).then((der) => { if (der) setState({ derived: der }) })
            } }),
              React.createElement('label', { htmlFor: 'ct-auto', style: { fontSize: 13, color: 'var(--dsw-alias-label-primary)' } }, '从图片自动搭配主题色'),
            ),
            Row(React.createElement('div', { style: labelStyle }, '背景主题色'),
              React.createElement(ColorField, { value: d.tint || fallback, manual: !!s.tint, onReset: () => setState({ tint: null }), onChange: (v) => setState({ tint: v }), hint: s.tint ? '手动' : '自动' }),
            ),
            Row(React.createElement('div', { style: labelStyle }, '按钮/强调色'),
              React.createElement(ColorField, { value: d.brand || fallback, manual: !!s.brand, onReset: () => setState({ brand: null }), onChange: (v) => setState({ brand: v }), hint: s.brand ? '手动' : '自动' }),
            ),
            Row(React.createElement('div', { style: labelStyle }, '侧边栏透明度'),
              React.createElement(SliderField, { value: Math.round(s.sidebarAlpha * 100), text: String(Math.round(s.sidebarAlpha * 100)) + '%', onChange: (v) => setState({ sidebarAlpha: v / 100 }) }),
            ),
          ),
          React.createElement(Section, { title: '输入框（对话框）' },
            Row(React.createElement('div', { style: labelStyle }, '背景色'),
              React.createElement(ColorField, { value: d.compLight || fallback, manual: !!s.composerBg, onReset: () => setState({ composerBg: null }), onChange: (v) => setState({ composerBg: v }), hint: s.composerBg ? '手动' : '自动搭配' }),
            ),
            Row(React.createElement('div', { style: labelStyle }, '不透明度'),
              React.createElement(SliderField, { value: Math.round(s.composerAlpha * 100), text: String(Math.round(s.composerAlpha * 100)) + '%', onChange: (v) => setState({ composerAlpha: v / 100 }) }),
            ),
            Row(React.createElement('div', { style: labelStyle }, '边框色'),
              React.createElement(ColorField, { value: s.composerBorder || fallback, manual: !!s.composerBorder, onReset: () => setState({ composerBorder: null }), onChange: (v) => setState({ composerBorder: v }), hint: s.composerBorder ? '手动' : '默认' }),
            ),
          ),
          React.createElement(Section, { title: '消息气泡' },
            Row(React.createElement('div', { style: labelStyle }, '背景色'),
              React.createElement(ColorField, { value: d.bubbleLight || fallback, manual: !!s.bubbleBg, onReset: () => setState({ bubbleBg: null }), onChange: (v) => setState({ bubbleBg: v }), hint: s.bubbleBg ? '手动' : '自动搭配' }),
            ),
            Row(React.createElement('div', { style: labelStyle }, '不透明度'),
              React.createElement(SliderField, { value: Math.round(s.bubbleAlpha * 100), text: String(Math.round(s.bubbleAlpha * 100)) + '%', onChange: (v) => setState({ bubbleAlpha: v / 100 }) }),
            ),
          ),
          React.createElement(Section, { title: '字体' },
            Row(React.createElement('div', { style: labelStyle }, '界面字体'),
              React.createElement(Select, { value: s.bodyFontKey, options: BODY_FONTS, onChange: (v) => setState({ bodyFontKey: v }) }),
            ),
            Row(React.createElement('div', { style: labelStyle }, '自定义界面字体'),
              React.createElement('input', { type: 'file', accept: '.ttf,.otf,.woff,.woff2', style: inputStyle, onChange: (e) => handleFontFile(e.target.files && e.target.files[0], 'body') }),
              s.bodyCustom ? React.createElement('button', { onClick: () => setState({ bodyCustom: null }), style: ghostBtn }, '移除 ' + s.bodyCustom.name) : null,
            ),
            Row(React.createElement('div', { style: labelStyle }, '代码字体'),
              React.createElement(Select, { value: s.codeFontKey, options: CODE_FONTS, onChange: (v) => setState({ codeFontKey: v }) }),
            ),
            Row(React.createElement('div', { style: labelStyle }, '自定义代码字体'),
              React.createElement('input', { type: 'file', accept: '.ttf,.otf,.woff,.woff2', style: inputStyle, onChange: (e) => handleFontFile(e.target.files && e.target.files[0], 'code') }),
              s.codeCustom ? React.createElement('button', { onClick: () => setState({ codeCustom: null }), style: ghostBtn }, '移除 ' + s.codeCustom.name) : null,
            ),
          ),
          React.createElement(Section, { title: '文字与边框' },
            Row(React.createElement('div', { style: labelStyle }, '主文字色'),
              React.createElement(ColorField, { value: s.labelPrimary || fallback, manual: !!s.labelPrimary, onReset: () => setState({ labelPrimary: null }), onChange: (v) => setState({ labelPrimary: v }), hint: s.labelPrimary ? '手动' : '默认' }),
            ),
            Row(React.createElement('div', { style: labelStyle }, '次要文字色'),
              React.createElement(ColorField, { value: s.labelSecondary || fallback, manual: !!s.labelSecondary, onReset: () => setState({ labelSecondary: null }), onChange: (v) => setState({ labelSecondary: v }), hint: s.labelSecondary ? '手动' : '默认' }),
            ),
            Row(React.createElement('div', { style: labelStyle }, '边框色'),
              React.createElement(ColorField, { value: s.borderColor || fallback, manual: !!s.borderColor, onReset: () => setState({ borderColor: null }), onChange: (v) => setState({ borderColor: v }), hint: s.borderColor ? '手动' : '默认' }),
            ),
          ),
          React.createElement('div', { style: { display: 'flex', gap: 10, marginTop: 4 } },
            React.createElement('button', { onClick: resetAll, style: ghostBtn }, '恢复默认'),
            React.createElement('button', { onClick: props.close, style: ghostBtn }, '完成'),
          ),
        )
      }

      ctx.slots.inject('settings.section', () => ctx.slots.register(
        { name: 'settings.section', id: 'custom-theme', order: 30, label: '自定义主题' },
        Page,
      ))

      // Re-apply any persisted configuration on load.
      applyTheme()
      applyCss()
    }

    return module.exports;
  }
});
