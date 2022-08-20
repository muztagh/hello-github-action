// Node.js core
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

// External
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const io = require('@actions/io');
const releases = require('@hashicorp/js-releases');

// arch in [arm, x32, x64...] (https://nodejs.org/api/os.html#os_os_arch)
// return value in [amd64, 386, arm]
function mapArch (arch) {
  const mappings = {
    x32: '386',
    x64: 'amd64'
  };
  return mappings[arch] || arch;
}

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS (os) {
  const mappings = {
    win32: 'windows'
  };
  return mappings[os] || os;
}

async function downloadCLI (url) {
  core.debug(`Downloading Terragrunt CLI from ${url}`);
  const pathToCLIZip = await tc.downloadTool(url);

  let pathToCLI = '';

  core.debug('Extracting Terragrunt CLI zip file');
  if (os.platform().startsWith('win')) {
    core.debug(`Terragrunt CLI Download Path is ${pathToCLIZip}`);
    const fixedPathToCLIZip = `${pathToCLIZip}.zip`;
    io.mv(pathToCLIZip, fixedPathToCLIZip);
    core.debug(`Moved download to ${fixedPathToCLIZip}`);
    pathToCLI = await tc.extractZip(fixedPathToCLIZip);
  } else {
    pathToCLI = await tc.extractZip(pathToCLIZip);
  }

  core.debug(`Terragrunt CLI path is ${pathToCLI}.`);

  if (!pathToCLIZip || !pathToCLI) {
    throw new Error(`Unable to download Terragrunt from ${url}`);
  }

  return pathToCLI;
}

async function run () {
  try {
    // Gather GitHub Actions inputs
    const version = '0.38.7';

    // Gather OS details
    const osPlatform = os.platform();
    const osArch = os.arch();

    core.debug(`Finding releases for Terragrunt version ${version}`);
    const platform = mapOS(osPlatform);
    const arch = mapArch(osArch);
    core.debug(`Getting build for Terragrunt version v0.38.7: ${platform} ${arch}`);
    const url = `https://github.com/gruntwork-io/terragrunt/releases/download/v${version}/terragrunt_${platform}_${arch}`
    core.debug(`Terraform download url: ${url}`)

    // Download requested version
    const pathToCLI = await downloadCLI(url);

    // Add to path
    core.addPath(pathToCLI);

    return release;
  } catch (error) {
    core.error(error);
    throw error;
  }
}

module.exports = run;