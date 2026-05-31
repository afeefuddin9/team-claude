import '../styles/globals.css';
import Head from 'next/head';

export default function TeamClaudeApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1C1917" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
