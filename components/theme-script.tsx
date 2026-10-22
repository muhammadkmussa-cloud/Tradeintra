const script = `(function(){var stored=null;try{stored=localStorage.getItem('tradeintra-theme');}catch(e){}var theme=stored==='light'||stored==='dark'?stored:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;var icon=document.getElementById('theme-favicon');if(icon)icon.setAttribute('href',theme==='dark'?'/favicon-dark.svg':'/favicon.svg');var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',theme==='dark'?'#0B090C':'#F3F2F2');})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
