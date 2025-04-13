

export function changeLanguage(lang: string) {
  localStorage.setItem('language', lang);
  const url = new URL(window.location.href);
  const [language, ...rest] = url.pathname.split("/");
  console.log(language)
  // window.location.href = url.origin + url.pathname + "?lang=" + lang;
}