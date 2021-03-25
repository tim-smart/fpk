export default [...Array(5000).keys()].reduce((config, index) => {
  const prefix = `app-${index}`;

  config[[prefix, "00-namespace"].join("/")] = {
    name: prefix,
  };
  config[[prefix, "10-app"].join("/")] = {
    name: prefix,
    image: `superimage:${index}`,
  };

  return config;
}, {} as { [file: string]: any });
