import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          {/* Google Fonts - Inter */}
          <link 
            rel="preconnect" 
            href="https://fonts.googleapis.com" 
          />
          <link 
            rel="preconnect" 
            href="https://fonts.gstatic.com" 
            crossOrigin="anonymous" 
          />
          <link 
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
            rel="stylesheet" 
          />
          
          {/* Font Awesome */}
          <link 
            rel="stylesheet" 
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
            integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
            crossOrigin="anonymous" 
            referrerPolicy="no-referrer" 
          />
          
          {/* Font Awesome Pro Kit */}
          <script src="https://kit.fontawesome.com/d0637c0c40.js" crossOrigin="anonymous"></script>
          
          {/* DataTables CSS */}
          <link rel="stylesheet" href="https://cdn.datatables.net/1.11.5/css/dataTables.tailwindcss.min.css" />
          
          {/* Alpine.js */}
          <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
        </Head>
        <body>
          <Main />
          <NextScript />
          
          {/* jQuery for DataTables */}
          <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
          <script src="https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js"></script>
          <script src="https://cdn.datatables.net/1.11.5/js/dataTables.tailwindcss.min.js"></script>
        </body>
      </Html>
    );
  }
}

export default MyDocument; 