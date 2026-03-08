/** @type {import('webpack').LoaderDefinitionFunction} */
module.exports = function stripFrontmatterLoader(source) {
  return source.replace(/^---[\s\S]*?---\r?\n?/, "");
};
