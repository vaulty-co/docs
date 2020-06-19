module.exports = {
  title: 'Vaulty',
  tagline: 'Encrypt, tokenize, mask your data transparently with Vaulty',
  url: 'https://vaulty-co.netlify.app',
  baseUrl: '/',
  favicon: 'img/favicon.png',
  organizationName: 'vaulty-co', // Usually your GitHub org/user name.
  projectName: 'vaulty', // Usually your repo name.
  themeConfig: {
	  sidebarCollapsible: false,
	  disableDarkMode: true,
    navbar: {
      title: 'Vaulty',
      logo: {
        alt: 'Vaulty',
        src: 'img/vaulty-logo.svg',
      },
      links: [
        { label: 'Cookbooks', to: '/cookbooks/intro', position: 'right', activeBasePath: '/cookbooks' },
        { label: 'GitHub', href: 'https://github.com/vaulty-co/vaulty', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Vaulty.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          homePageId: 'intro',
	  routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/vaulty-co/website/edit/master/',

        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
