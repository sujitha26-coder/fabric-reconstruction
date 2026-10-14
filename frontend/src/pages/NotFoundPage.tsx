import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7a564d]">404</p>
      <h1 className="mt-3 font-serif text-5xl text-[#382B27]">The pattern could not be found.</h1>
      <p className="mt-4 max-w-lg text-base leading-7 text-[#5f4d49]">
        The page you are looking for may have moved, but the studio is still ready to help you explore the collection.
      </p>
      <Link to="/" className="mt-8 inline-flex items-center rounded-full bg-[#b65335] px-6 py-3 text-sm font-medium text-white shadow-soft">
        Return Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
