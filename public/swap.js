
const tokenAddresses = {
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  DAI:  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
};

const tokenPricesUSD = {
  WETH: 4500,
  DAI: 1,
  USDC: 1,
  USDT: 1
};

const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; //Replace with your deployed router address here
const routerABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

async function swapTokens() {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const router = new ethers.Contract(routerAddress, routerABI, signer);

    const tokenFrom = document.getElementById("tokenFrom").value;
    const tokenTo = document.getElementById("tokenTo").value;

    const amountInUSD = parseFloat(document.getElementById("amountInUSD").value);
    const amountOutMinUSD = parseFloat(document.getElementById("amountOutMinUSD").value);
    const to = document.getElementById("toAddress").value;
    const status = document.getElementById("status");

    const amountIn = amountInUSD / tokenPricesUSD[tokenFrom];
    const amountOutMin = amountOutMinUSD / tokenPricesUSD[tokenTo];

    const decimals = (tokenFrom === "USDC" || tokenFrom === "USDT") ? 6 : 18;
    const amountInWei = ethers.utils.parseUnits(amountIn.toString(), decimals);
    const decimalsOut = (tokenTo === "USDC" || tokenTo === "USDT") ? 6 : 18;
    const amountOutMinWei = ethers.utils.parseUnits(amountOutMin.toString(), decimalsOut);

    const path = [tokenAddresses[tokenFrom], tokenAddresses[tokenTo]];
    const deadline = Math.floor(Date.now() / 1000) + 300;

    status.innerText = `Approving ${tokenFrom}...`;

    const erc20ABI = ["function approve(address spender, uint value) public returns (bool)"];
    const tokenContract = new ethers.Contract(tokenAddresses[tokenFrom], erc20ABI, signer);
    const txApprove = await tokenContract.approve(routerAddress, amountInWei);
    await txApprove.wait();

    status.innerText = "Swapping...";

    const tx = await router.swapExactTokensForTokens(
      amountInWei,
      amountOutMinWei,
      path,
      to,
      deadline
    );
    await tx.wait();

    status.innerText = `Swap successful! TX: ${tx.hash}`;
  } catch (err) {
    document.getElementById("status").innerText = `Error: ${err.message}`;
    console.error(err);
  }
}
