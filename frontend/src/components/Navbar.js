import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  // State for current language (e.g., 'es' or 'en')
  const [lang, setLang] = useState(i18n.language ? i18n.language.split('-')[0] : 'es');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const changeLanguage = (lng) => {
    setLang(lng);
    i18n.changeLanguage(lng);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow fixed w-full top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
          ParaTodos IA
        </Link>
        <nav className="flex items-center space-x-4">
          <Link to="/" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
            {t('inicio')}
          </Link>
          <Link to="/crear-tienda" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
            {t('crear_tienda')}
          </Link>
          {/* Language toggle buttons */}
          <button
            type="button"
            onClick={() => changeLanguage('es')}
            className={`px-2 py-1 rounded transition-colors ${lang === 'es'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >ES</button>
          <button
            type="button"
            onClick={() => changeLanguage('en')}
            className={`px-2 py-1 rounded transition-colors ${lang === 'en'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >EN</button>
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Light mode' : 'Dark mode'}
            className="ml-2 p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded transition-colors"
          >{darkMode ? '☀️' : '🌙'}</button>
        </nav>
      </div>
    </header>
  );
};


export default Navbar;
