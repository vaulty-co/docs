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
        {
          to: 'docs/intro',
          activeBasePath: 'docs',
          label: 'Documentation',
          position: 'right',
        },
        {
          href: 'https://github.com/vaulty-co/vaulty',
          label: 'GitHub',
          position: 'right',
        },
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
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/vaulty-co/website/edit/master/website/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/facebook/docusaurus/edit/master/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
