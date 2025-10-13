const tokenAddresses = {
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  DAI:  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
};

const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const routerABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

const erc20ABI = [
  "function approve(address spender, uint value) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)"
];

let provider, signer, userAddress;

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

    const tokenFrom = document.getElementById("tokenFrom").value;
    const tokenTo = document.getElementById("tokenTo").value;
    const inputMode = document.getElementById("inputMode").value;
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
      status.innerText = `⏳ Approving ${tokenFrom}...`;
      const txApprove = await tokenFromContract.approve(routerAddress, amountInWei);
      await txApprove.wait();
    }

    status.innerText = `💱 Swapping ${tokenFrom} → ${tokenTo}...`;
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
    document.getElementById("status").innerText = `Error: ${err.message}`;
    console.error(err);
  }
}
