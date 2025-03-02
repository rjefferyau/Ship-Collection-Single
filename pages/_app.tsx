import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Starship Collection Manager - Track and manage your Star Trek starship collection" />
        <meta name="keywords" content="Star Trek, starships, collection, manager, tracking" />
        <title>Starship Collection Manager</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp; 