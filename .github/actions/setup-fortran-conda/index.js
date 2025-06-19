const core = require('@actions/core');
const exec = require('@actions/exec');

async function execCondaCommand_lin(command, env = {}) {
    return await execCommand_lin(`. $CONDA/etc/profile.d/conda.sh && conda activate fortran && ${command}`, env);
}

async function execCondaCommand_win(command, env = {}) {
    return await execCommand_win(`. $CONDA/etc/profile.d/conda.sh && conda activate fortran && ${command}`, env);
}

async function execCondaCommand_mac(command, env = {}) {
    return await execCommand_mac(`. $CONDA/etc/profile.d/conda.sh && conda activate fortran && ${command}`, env);
}


async function execCommand_lin(command, env = {}) {
    return await execCommand(command, '/bin/bash', env);
}

async function execCommand_win(command, env = {}) {
    return await execCommand(command, 'bash.exe', env);
}

async function execCommand_mac(command, env = {}) {
    return await execCommand(command, '/bin/bash', env);
}


async function execCommand(command, shell, env = {}) {
    let output = '';
    const options = {
        listeners: {
            stdout: (data) => { output += data.toString(); },
            stderr: (data) => { output += data.toString(); }
        },
        env: { ...process.env, ...env }
    };

    const exitCode = await exec.exec(shell, ['-c', command], options);
    if (exitCode !== 0) {
        core.setFailed(`Command failed: ${command}\nOutput: ${output}`);
    }

    return output;
}

async function install_fpm_lin() {
    core.info('Installing fpm on Linux...');
    await execCondaCommand_lin('conda install -y -c conda-forge fpm');
}

async function install_fpm_win() {
    core.info('Installing fpm on Windows...');
    await execCondaCommand_win('conda install -y -c conda-forge fpm');
}

async function install_fpm_mac() {
    core.info('Installing fpm on macOS...');
    await execCondaCommand_mac('conda install -y -c conda-forge fpm');
}


async function install_fpm(platform) {
    const installFunctions = {
        'ubuntu-latest': install_fpm_lin,
        'windows-latest': install_fpm_win,
        'macos-latest': install_fpm_mac
    };

    if (installFunctions[platform]) {
        await installFunctions[platform]();
    } else {
        core.warning(`No fpm installation method defined for ${platform}.`);
    }
}


async function install_gfortran_lin() {
    core.info('Installing gfortran on Linux...');
    await execCondaCommand_lin('conda install -y -c conda-forge gfortran_linux-64');
}

async function install_gfortran_win() {
    core.info('Installing gfortran on Windows...');
    await execCondaCommand_win('conda install -y -c conda-forge gfortran_win-64');
}

async function install_gfortran_mac() {
    core.info('Installing gfortran on macOS...');
    await execCondaCommand_mac('conda install -y -c conda-forge gfortran_osx-64');
}


async function install_ifx_lin() {
    core.info('Installing IFX on Linux...');
    await execCondaCommand_lin('conda install -y -c conda-forge ifx_linux-64');
}

async function install_ifx_win() {
    core.info('Installing IFX on Windows...');
    await execCondaCommand_win('conda install -y -c conda-forge ifx_win-64');
}

async function install_ifx_mac() {
    core.warning('IFX is not available on macOS via Conda.');
}


async function install_flang_lin() {
    core.info('Installing Flang on Linux...');
    await execCondaCommand_lin('conda install -y -c conda-forge flang');
}

async function install_flang_win() {
    core.info('Installing Flang on Windows...');
    await execCondaCommand_win('conda install -y -c conda-forge flang');
}

async function install_flang_mac() {
    core.warning('Flang is not available on macOS via Conda.');
}


async function install_lfortran_lin() {
    core.info('Installing LFortran on Linux...');
    await execCondaCommand_lin('conda install -y -c conda-forge lfortran');
}

async function install_lfortran_win() {
    core.info('Installing LFortran on Windows...');
    await execCondaCommand_win('conda install -y -c conda-forge lfortran');
}

async function install_lfortran_mac() {
    core.info('Installing LFortran on macOS...');
    await execCondaCommand_mac('conda install -y -c conda-forge lfortran');
}


async function install_packages_lin(packages) {
    core.info(`Installing additional packages on Linux: ${packages}`);
    await execCondaCommand_lin(`conda install -y -c conda-forge ${packages}`);
}

async function install_packages_win(packages) {
    core.info(`Installing additional packages on Windows: ${packages}`);
    await execCondaCommand_win(`conda install -y -c conda-forge ${packages}`);
}

async function install_packages_mac(packages) {
    core.info(`Installing additional packages on macOS: ${packages}`);
    await execCondaCommand_mac(`conda install -y -c conda-forge ${packages}`);
}


async function install_compiler(compiler, platform) {
    const installFunctions = {
        'gfortran': {
            'ubuntu-latest': install_gfortran_lin,
            'windows-latest': install_gfortran_win,
            'macos-latest': install_gfortran_mac
        },
        'ifx': {
            'ubuntu-latest': install_ifx_lin,
            'windows-latest': install_ifx_win,
            'macos-latest': install_ifx_mac
        },
        'flang-new': {
            'ubuntu-latest': install_flang_lin,
            'windows-latest': install_flang_win,
            'macos-latest': install_flang_mac
        },
        'lfortran': {
            'ubuntu-latest': install_lfortran_lin,
            'windows-latest': install_lfortran_win,
            'macos-latest': install_lfortran_mac
        }
    };

    if (installFunctions[compiler] && installFunctions[compiler][platform]) {
        await installFunctions[compiler][platform]();
    } else {
        core.warning(`No installation method defined for ${compiler} on ${platform}.`);
    }
}


async function install_packages(platform, packages) {
    const installFunctions = {
        'ubuntu-latest': install_packages_lin,
        'windows-latest': install_packages_win,
        'macos-latest': install_packages_mac
    };

    if (packages.trim()) {
        if (installFunctions[platform]) {
            await installFunctions[platform](packages);
        } else {
            core.warning(`No package installation method defined for ${platform}.`);
        }
    }
}


async function configure_runtime_environment(compiler, platform) {
    if (platform === 'ubuntu-latest') {
        core.info(`Configuring runtime environment for ${compiler} on Linux...`);

        let condaPrefix = '';
        await exec.exec('conda', ['info', '--base'], {
            listeners: {
                stdout: (data) => {
                    condaPrefix += data.toString();
                }
            }
        });

        condaPrefix = condaPrefix.trim();

        if (!condaPrefix) {
            core.setFailed('Failed to determine CONDA_PREFIX. Conda might not be properly configured.');
            return;
        }

        const ldLibraryPath = `${condaPrefix}/envs/fortran/lib:${process.env.LD_LIBRARY_PATH || ''}`;

        core.exportVariable('LD_LIBRARY_PATH', ldLibraryPath);
        core.info(`LD_LIBRARY_PATH set to ${ldLibraryPath}`);
    }
}


async function run() {
    try {
        const compiler = core.getInput('compiler');
        const platform = core.getInput('platform');
        const packages = core.getInput('packages');

        core.info('Starting Fortran setup action...');

        await install_fpm(platform);
        await install_compiler(compiler, platform);
        await install_packages(platform, packages);

        await configure_runtime_environment(compiler, platform);

        core.info('Fortran setup action completed successfully.');

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();