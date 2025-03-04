import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import '../styles/sidebar.css';
import 'bootswatch/dist/darkly/bootstrap.min.css';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

// IMPORTANT: Layout Management
// 
// This application uses a global Layout component that wraps all pages.
// When creating new pages:
// 1. DO NOT import or use the Layout component in individual page files
// 2. Pages should only return their content without any layout wrapper
// 3. The activeTab is automatically determined based on the URL path below
//
// See the Management page for an example of the correct structure.

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const path = router.pathname;
  
  // Determine active tab based on current path
  let activeTab = 'collection';
  if (path === '/fancy-view') activeTab = 'fancy-view';
  else if (path === '/statistics') activeTab = 'statistics';
  else if (path === '/price-vault') activeTab = 'price-vault';
  else if (path === '/wishlist') activeTab = 'wishlist';
  else if (path === '/management') activeTab = 'management';
  else if (path === '/setup') activeTab = 'setup';
  else if (path === '/icon-setup') activeTab = 'icon-setup';
  else if (path === '/faction-setup') activeTab = 'faction-setup';
  else if (path === '/edition-setup') activeTab = 'edition-setup';
  else if (path === '/import-export') activeTab = 'import-export';
  else if (path === '/currency-setup') activeTab = 'currency-setup';
  
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Starship Collection Manager - Track and manage your Star Trek starship collection" />
        <meta name="keywords" content="Star Trek, starships, collection, manager, tracking" />
        <title>Starship Collection Manager</title>
      </Head>
      <Layout activeTab={activeTab}>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default MyApp;