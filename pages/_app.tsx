import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { ThemeProvider } from '../contexts/ThemeContext';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const path = router.pathname;
  
  // Determine active tab based on current path
  let activeTab = 'collection';
  if (path === '/fancy-view') activeTab = 'fancy-view';
  else if (path === '/statistics') activeTab = 'statistics';
  else if (path === '/setup') activeTab = 'setup';
  
  return (
    <ThemeProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Starship Collection Manager - Track and manage your Star Trek starship collection" />
        <meta name="keywords" content="Star Trek, starships, collection, manager, tracking" />
        <title>Starship Collection Manager</title>
      </Head>
      <Layout activeTab={activeTab}>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
}

export default MyApp; 