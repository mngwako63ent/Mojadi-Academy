import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-green-200 bg-green-50 py-12 dark:border-green-900 dark:bg-green-950">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold text-green-900 dark:text-green-100">Mojadi Academy</h3>
            <p className="mt-4 max-w-sm text-sm text-green-700 dark:text-green-300">
              Empowering farmers with quality agricultural education. Learn from experts and grow your farming success.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-green-900 dark:text-green-100">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-sm text-green-700 dark:text-green-300">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/courses">Courses</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-green-900 dark:text-green-100">Contact</h4>
            <ul className="mt-4 space-y-2 text-sm text-green-700 dark:text-green-300">
              <li>Mojadifarmholding@gmail.com</li>
              <li>084 520 2073</li>
              <li>South Africa</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-green-200 pt-8 text-center text-sm text-green-600 dark:border-green-900 dark:text-green-400">
          &copy; 2026 Mojadi Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
