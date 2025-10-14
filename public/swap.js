const tokenAddresses = {
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  DAI:  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
};
const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const routerABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
  "function factory() external pure returns (address)"
];
const erc20ABI = [
  "function approve(address spender, uint value) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)"
];

const factoryABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
  "function allPairs(uint) external view returns (address pair)",
  "function allPairsLength() external view returns (uint)"
];

const pairABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)"
];

let provider, signer, userAddress;

document.addEventListener('DOMContentLoaded', function() {
  const navItems = document.querySelectorAll('.nav-item[data-page]');
  const pageSections = document.querySelectorAll('.page-section');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetPage = item.getAttribute('data-page');
      
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      pageSections.forEach(section => section.classList.remove('active'));
      document.getElementById(targetPage + 'Page').classList.add('active');
    });
  });
  
  const themeToggle = document.getElementById('themeToggle');
  const currentTheme = localStorage.getItem('theme') || 'dark';
  
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);
  
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
  
  function updateThemeIcon(theme) {
    themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
  
  setupPoolFunctionality();
});

function toggleDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  const menu = dropdown.querySelector('.dropdown-menu');
  const toggle = dropdown.querySelector('.dropdown-toggle');
  
  document.querySelectorAll('.dropdown-menu').forEach(m => {
    if (m !== menu) m.style.display = 'none';
  });
  document.querySelectorAll('.dropdown-toggle').forEach(t => {
    if (t !== toggle) t.classList.remove('open');
  });
  
  const isOpen = menu.style.display === 'block';
  menu.style.display = isOpen ? 'none' : 'block';
  toggle.classList.toggle('open', !isOpen);
}

function selectToken(dropdownId, tokenSymbol, iconUrl) {
  const dropdown = document.getElementById(dropdownId);
  const toggle = dropdown.querySelector('.dropdown-toggle');
  const menu = dropdown.querySelector('.dropdown-menu');
  const selectedItem = dropdown.querySelector(`[data-value="${tokenSymbol}"]`);
  
  const tokenIcon = toggle.querySelector('.token-icon');
  const tokenName = toggle.querySelector('.token-name');
  if (tokenIcon) {
    tokenIcon.src = iconUrl;
    tokenIcon.alt = tokenSymbol;
  }
  tokenName.textContent = tokenSymbol;
  
  dropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.classList.remove('selected');
  });
  selectedItem.classList.add('selected');
  
  menu.style.display = 'none';
  toggle.classList.remove('open');
  
  const hiddenSelect = document.getElementById(dropdownId.replace('Dropdown', ''));
  if (hiddenSelect) {
    hiddenSelect.value = tokenSymbol;
  }
}

function selectMode(dropdownId, modeValue, displayName) {
  const dropdown = document.getElementById(dropdownId);
  const toggle = dropdown.querySelector('.dropdown-toggle');
  const menu = dropdown.querySelector('.dropdown-menu');
  const selectedItem = dropdown.querySelector(`[data-value="${modeValue}"]`);
  
  const modeName = toggle.querySelector('.token-name');
  modeName.textContent = displayName;
  
  dropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.classList.remove('selected');
  });
  selectedItem.classList.add('selected');
  
  menu.style.display = 'none';
  toggle.classList.remove('open');
  
  const hiddenSelect = document.getElementById(dropdownId.replace('Dropdown', ''));
  if (hiddenSelect) {
    hiddenSelect.value = modeValue;
  }
}

document.addEventListener('click', function(event) {
  if (!event.target.closest('.custom-dropdown')) {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.style.display = 'none';
    });
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
      toggle.classList.remove('open');
    });
  }
});

function setupPoolFunctionality() {
  const poolAmountA = document.getElementById('poolAmountA');
  const poolAmountB = document.getElementById('poolAmountB');
  const poolTokenA = document.getElementById('poolTokenA');
  const poolTokenB = document.getElementById('poolTokenB');
  
  if (poolAmountA) {
    poolAmountA.addEventListener('input', calculatePoolAmountB);
  }
  
  const addLiquidityBtn = document.getElementById('addLiquidityBtn');
  if (addLiquidityBtn) {
    addLiquidityBtn.addEventListener('click', addLiquidity);
  }
  loadPositions();
}

document.getElementById("connectWallet").onclick = async () => {
  if (!window.ethereum) {
    alert("Please install MetaMask!");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();
  document.getElementById("walletAddress").innerText = "Wallet: " + userAddress;
};

document.getElementById("disconnectWallet").onclick = () => {
  provider = null;
  signer = null;
  userAddress = null;
  document.getElementById("walletAddress").innerText = "Wallet: Not connected";
};

const swapButtonEl = document.getElementById("swapButton");
if (swapButtonEl) {
  swapButtonEl.addEventListener("click", () => {
    swapButtonEl.classList.remove("pulse");
    void swapButtonEl.offsetWidth;
    swapButtonEl.classList.add("pulse");
  });
}

const switchPairEl = document.getElementById("switchPair");
if (switchPairEl) {
  switchPairEl.addEventListener("click", () => {
    const tokenFromDropdown = document.getElementById("tokenFromDropdown");
    const tokenToDropdown = document.getElementById("tokenToDropdown");
    
    const fromToggle = tokenFromDropdown.querySelector('.dropdown-toggle');
    const toToggle = tokenToDropdown.querySelector('.dropdown-toggle');
    
    const fromIcon = fromToggle.querySelector('.token-icon');
    const fromName = fromToggle.querySelector('.token-name');
    const toIcon = toToggle.querySelector('.token-icon');
    const toName = toToggle.querySelector('.token-name');
    
    const tempIcon = fromIcon.src;
    const tempName = fromName.textContent;
    fromIcon.src = toIcon.src;
    fromName.textContent = toName.textContent;
    toIcon.src = tempIcon;
    toName.textContent = tempName;
    
    tokenFromDropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.classList.toggle('selected', item.dataset.value === fromName.textContent);
    });
    tokenToDropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.classList.toggle('selected', item.dataset.value === toName.textContent);
    });
    
    fromToggle.classList.add("flash");
    toToggle.classList.add("flash");
    setTimeout(() => { 
      fromToggle.classList.remove("flash"); 
      toToggle.classList.remove("flash"); 
    }, 300);
  });
}

async function fetchTokenPrices() {
  const ids = ['weth','dai','usd-coin','tether'];
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
  const response = await fetch(url);
  const data = await response.json();
  return {
    WETH: data.weth.usd,
    DAI: data.dai.usd,
    USDC: data['usd-coin'].usd,
    USDT: data.tether.usd
  };
}

document.getElementById("swapButton").onclick = swapTokens;

async function swapTokens() {
  try {
    if (!signer) {
      alert("Please connect your wallet first!");
      return;
    }

    const tokenFromDropdown = document.getElementById("tokenFromDropdown");
    const tokenToDropdown = document.getElementById("tokenToDropdown");
    const tokenFrom = tokenFromDropdown.querySelector('.token-name').textContent;
    const tokenTo = tokenToDropdown.querySelector('.token-name').textContent;
    const inputModeDropdown = document.getElementById("inputModeDropdown");
    const inputMode = inputModeDropdown.querySelector('.dropdown-item.selected').dataset.value;
    const amountInput = parseFloat(document.getElementById("amountInput").value);
    const slippagePercent = parseFloat(document.getElementById("slippage").value || 1);
    const status = document.getElementById("status");

    if (tokenFrom === tokenTo) {
      alert("You cannot swap the same token.");
      return;
    }

    const router = new ethers.Contract(routerAddress, routerABI, signer);
    const tokenFromContract = new ethers.Contract(tokenAddresses[tokenFrom], erc20ABI, signer);
    const tokenToContract = new ethers.Contract(tokenAddresses[tokenTo], erc20ABI, signer);

    const decimalsFrom = await tokenFromContract.decimals();

    let amountInToken;
    if (inputMode === "usd") {
      const tokenPricesUSD = await fetchTokenPrices();
      amountInToken = amountInput / tokenPricesUSD[tokenFrom];
    } else {
      amountInToken = amountInput;
    }

    amountInToken = Number(amountInToken.toFixed(decimalsFrom));
    const amountInWei = ethers.utils.parseUnits(amountInToken.toString(), decimalsFrom);

    const balance = await tokenFromContract.balanceOf(userAddress);
    if (balance.lt(amountInWei)) {
      status.innerText = `Insufficient ${tokenFrom} balance.`;
      return;
    }

    const path = [tokenAddresses[tokenFrom], tokenAddresses[tokenTo]];
    const amountsOut = await router.getAmountsOut(amountInWei, path);
    const quotedOut = amountsOut[amountsOut.length - 1];
    const amountOutMin = quotedOut.mul(100 - slippagePercent).div(100);

    const allowance = await tokenFromContract.allowance(userAddress, routerAddress);
    if (allowance.lt(amountInWei)) {
      status.innerText = `Approving ${tokenFrom}...`;
      const txApprove = await tokenFromContract.approve(routerAddress, amountInWei);
      await txApprove.wait();
    }

    status.innerText = `Swapping ${tokenFrom} to ${tokenTo}...`;
    const deadline = Math.floor(Date.now() / 1000) + 300;
    const tx = await router.swapExactTokensForTokens(
      amountInWei,
      amountOutMin,
      path,
      userAddress,
      deadline,
      { gasLimit: ethers.utils.hexlify(200000) }
    );

    await tx.wait();
    status.innerText = `Swap successful! TX: ${tx.hash}`;
  } catch (err) {
    const msg = (err && err.code === "ACTION_REJECTED") ? "Canceled the transaction." : `Error: ${err.message}`;
    document.getElementById("status").innerText = msg;
    console.error(err);
  }
}

async function calculatePoolAmountB() {
  try {
    const tokenADropdown = document.getElementById('poolTokenADropdown');
    const tokenBDropdown = document.getElementById('poolTokenBDropdown');
    const tokenA = tokenADropdown.querySelector('.token-name').textContent;
    const tokenB = tokenBDropdown.querySelector('.token-name').textContent;
    const amountA = parseFloat(document.getElementById('poolAmountA').value);
    
    if (!amountA || amountA <= 0 || !provider) return;
    
    const router = new ethers.Contract(routerAddress, routerABI, provider);
    const factoryAddress = await router.factory();
    const factory = new ethers.Contract(factoryAddress, factoryABI, provider);
    
    const pairAddress = await factory.getPair(tokenAddresses[tokenA], tokenAddresses[tokenB]);
    
    if (pairAddress === ethers.constants.AddressZero) {
      const prices = await fetchTokenPrices();
      const ratio = prices[tokenA] / prices[tokenB];
      document.getElementById('poolAmountB').value = (amountA * ratio).toFixed(6);
      return;
    }
    
    const pair = new ethers.Contract(pairAddress, pairABI, provider);
    const reserves = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    
    let reserveA, reserveB;
    if (token0.toLowerCase() === tokenAddresses[tokenA].toLowerCase()) {
      reserveA = reserves.reserve0;
      reserveB = reserves.reserve1;
    } else {
      reserveA = reserves.reserve1;
      reserveB = reserves.reserve0;
    }
    const amountB = (amountA * reserveB) / reserveA;
    document.getElementById('poolAmountB').value = ethers.utils.formatEther(amountB);
    
  } catch (err) {
    console.error('Error calculating pool amount:', err);
  }
}

async function addLiquidity() {
  try {
    if (!signer) {
      alert("Please connect your wallet first!");
      return;
    }
    
    const tokenADropdown = document.getElementById('poolTokenADropdown');
    const tokenBDropdown = document.getElementById('poolTokenBDropdown');
    const tokenA = tokenADropdown.querySelector('.token-name').textContent;
    const tokenB = tokenBDropdown.querySelector('.token-name').textContent;
    const amountA = parseFloat(document.getElementById('poolAmountA').value);
    const amountB = parseFloat(document.getElementById('poolAmountB').value);
    const slippagePercent = parseFloat(document.getElementById('poolSlippage').value || 1);
    const status = document.getElementById('poolStatus');
    
    if (tokenA === tokenB) {
      alert("Cannot create pool with same token!");
      return;
    }
    
    if (!amountA || !amountB || amountA <= 0 || amountB <= 0) {
      alert("Please enter valid amounts!");
      return;
    }
    
    const router = new ethers.Contract(routerAddress, routerABI, signer);
    const tokenAContract = new ethers.Contract(tokenAddresses[tokenA], erc20ABI, signer);
    const tokenBContract = new ethers.Contract(tokenAddresses[tokenB], erc20ABI, signer);
    
    const decimalsA = await tokenAContract.decimals();
    const decimalsB = await tokenBContract.decimals();
    
    const amountADesired = ethers.utils.parseUnits(amountA.toString(), decimalsA);
    const amountBDesired = ethers.utils.parseUnits(amountB.toString(), decimalsB);
    const balanceA = await tokenAContract.balanceOf(userAddress);
    const balanceB = await tokenBContract.balanceOf(userAddress);
    
    if (balanceA.lt(amountADesired)) {
      status.innerText = `Insufficient ${tokenA} balance`;
      return;
    }
    if (balanceB.lt(amountBDesired)) {
      status.innerText = `Insufficient ${tokenB} balance`;
      return;
    }
    const allowanceA = await tokenAContract.allowance(userAddress, routerAddress);
    if (allowanceA.lt(amountADesired)) {
      status.innerText = `Approving ${tokenA}...`;
      const txApproveA = await tokenAContract.approve(routerAddress, amountADesired);
      await txApproveA.wait();
    }
    
    const allowanceB = await tokenBContract.allowance(userAddress, routerAddress);
    if (allowanceB.lt(amountBDesired)) {
      status.innerText = `Approving ${tokenB}...`;
      const txApproveB = await tokenBContract.approve(routerAddress, amountBDesired);
      await txApproveB.wait();
    }
    status.innerText = `Adding liquidity ${tokenA}/${tokenB}...`;
    const deadline = Math.floor(Date.now() / 1000) + 300;
    const slippageMultiplier = 100 - slippagePercent;
    const amountAMin = amountADesired.mul(slippageMultiplier).div(100);
    const amountBMin = amountBDesired.mul(slippageMultiplier).div(100);
    
    const tx = await router.addLiquidity(
      tokenAddresses[tokenA],
      tokenAddresses[tokenB],
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      userAddress,
      deadline,
      { gasLimit: ethers.utils.hexlify(300000) }
    );
    
    await tx.wait();
    status.innerText = `Liquidity added! TX: ${tx.hash}`;
    document.getElementById('poolAmountA').value = '';
    document.getElementById('poolAmountB').value = '';
    loadPositions();
    
  } catch (err) {
    const msg = (err && err.code === "ACTION_REJECTED") ? "Canceled the transaction." : `Error: ${err.message}`;
    document.getElementById('poolStatus').innerText = msg;
    console.error(err);
  }
}

async function loadPositions() {
  try {
    if (!signer || !provider) {
      return;
    }
    
    const positionsList = document.getElementById('positionsList');
    positionsList.innerHTML = '<p>Loading positions...</p>';
    
    const router = new ethers.Contract(routerAddress, routerABI, provider);
    const factoryAddress = await router.factory();
    const factory = new ethers.Contract(factoryAddress, factoryABI, provider);
    const pairsLength = await factory.allPairsLength();
    const positions = [];
    
    for (let i = 0; i < Math.min(pairsLength, 10); i++) {
      const pairAddress = await factory.allPairs(i);
      const pair = new ethers.Contract(pairAddress, pairABI, provider);
      
      const balance = await pair.balanceOf(userAddress);
      if (balance.gt(0)) {
        const totalSupply = await pair.totalSupply();
        const reserves = await pair.getReserves();
        const token0 = await pair.token0();
        const token1 = await pair.token1();
        const token0Symbol = Object.keys(tokenAddresses).find(key => 
          tokenAddresses[key].toLowerCase() === token0.toLowerCase()
        ) || 'Unknown';
        const token1Symbol = Object.keys(tokenAddresses).find(key => 
          tokenAddresses[key].toLowerCase() === token1.toLowerCase()
        ) || 'Unknown';
        
        const share = balance.mul(100).div(totalSupply);
        const reserve0Formatted = ethers.utils.formatEther(reserves.reserve0);
        const reserve1Formatted = ethers.utils.formatEther(reserves.reserve1);
        
        positions.push({
          pair: `${token0Symbol}/${token1Symbol}`,
          balance: ethers.utils.formatEther(balance),
          share: share.toString() + '%',
          reserve0: reserve0Formatted,
          reserve1: reserve1Formatted,
          pairAddress: pairAddress
        });
      }
    }
    
    if (positions.length === 0) {
      positionsList.innerHTML = `
        <p>No liquidity positions found.</p>
        <p style="font-size: 12px; margin-top: 8px;">Add liquidity to see your positions here.</p>
      `;
    } else {
      positionsList.innerHTML = positions.map(pos => `
        <div style="padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 8px; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong>${pos.pair}</strong>
            <span style="font-size: 12px; color: var(--text-secondary);">${pos.share} share</span>
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
            LP Balance: ${pos.balance}<br>
            Reserves: ${pos.reserve0} / ${pos.reserve1}
          </div>
          <button onclick="removeLiquidity('${pos.pairAddress}')" class="ghost-btn" style="margin-top: 8px; padding: 4px 8px; font-size: 12px;">
            Remove Liquidity
          </button>
        </div>
      `).join('');
    }
    
  } catch (err) {
    console.error('Error loading positions:', err);
    document.getElementById('positionsList').innerHTML = '<p>Error loading positions.</p>';
  }
}
