import { NextPage } from 'next';
import { NextPageContext } from 'next';
import Head from 'next/head';
import Link from 'next/link';

interface CustomErrorProps {
  statusCode: number;
}

const CustomError: NextPage<CustomErrorProps> = ({ statusCode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>Error {statusCode} | CollectHub</title>
      </Head>
      <div className="text-center p-8 max-w-md">
        <div className="mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 text-red-500 mx-auto" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {statusCode
            ? `Error ${statusCode}`
            : 'An error occurred on client'}
        </h1>
        <p className="text-gray-600 mb-6">
          {statusCode === 404
            ? "We couldn't find the page you're looking for."
            : "We're sorry, something went wrong on our end."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

CustomError.getInitialProps = ({ res, err }: NextPageContext): CustomErrorProps => {
  const statusCode = res ? res.statusCode : err ? (err as Error & { statusCode?: number }).statusCode : 404;
  return { statusCode: statusCode || 500 };
};

export default CustomError; 