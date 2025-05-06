import React from 'react';

const Footer = () => (
  <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4 transition-colors">
    <p className="text-sm text-gray-600 dark:text-gray-400">
      © {new Date().getFullYear()} ParaTodos.IA. Todos los derechos reservados.
    </p>
  </footer>
);

export default Footer;