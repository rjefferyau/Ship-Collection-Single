import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import '../styles/sidebar.css';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { CurrencyProvider } from '../contexts/CurrencyContext';

// IMPORTANT: Layout Management
// 
// This application uses a global Layout component that wraps all pages.
// When creating new pages:
// 1. DO NOT import or use the Layout component in individual page files
// 2. Pages should only return their content without any layout wrapper
// 3. The Layout component handles the header and footer for all pages
//
// See the Management page for an example of the correct structure.

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const path = router.pathname;
  
  // Determine page title based on current path
  let pageTitle = 'The Collection';
  if (path === '/fancy-view') pageTitle = 'Gallery | CollectHub';
  else if (path === '/statistics') pageTitle = 'Statistics | CollectHub';
  else if (path === '/price-vault') pageTitle = 'Price Vault | CollectHub';
  else if (path === '/wishlist') pageTitle = 'Wishlist | CollectHub';
  else if (path === '/management') pageTitle = 'Management | CollectHub';
  else if (path === '/setup') pageTitle = 'Setup | CollectHub';
  else if (path === '/icon-setup') pageTitle = 'Icon Setup | CollectHub';
  else if (path === '/faction-setup') pageTitle = 'Faction Setup | CollectHub';
  else if (path === '/edition-setup') pageTitle = 'Edition Setup | CollectHub';
  else if (path === '/import-export') pageTitle = 'Import/Export | CollectHub';
  else if (path === '/currency-setup') pageTitle = 'Currency Setup | CollectHub';
  else if (path === '/other-tools') pageTitle = 'Other Tools | CollectHub';
  
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="CollectHub - Track and manage your collectibles" />
        <meta name="keywords" content="Star Trek, starships, collection, manager, tracking" />
        <title>{pageTitle}</title>
      </Head>
      <CurrencyProvider>
        <Layout title={pageTitle}>
          <Component {...pageProps} />
        </Layout>
      </CurrencyProvider>
    </>
  );
}

export default MyApp;