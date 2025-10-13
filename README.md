# My DEX – Uniswap V2 Token Swap Interface

[![Live Site](https://img.shields.io/badge/Live_Site-Vercel-green?style=flat-square)](https://mydex-seven.vercel.app)
[![Preview](https://img.shields.io/badge/Preview-Latest_Deploy-blue?style=flat-square)](https://mydex-seven.vercel.app)

A simple Uniswap V2-style token swap interface built with **HTML + JS + MetaMask + Ethers.js**.

---

### ⚙️ Setup / Usage

1. **Deploy contracts**
   - Deploy your Factory contract.  
   - Deploy your Router contract and link it to the Factory.

2. **Prepare tokens**
   - Add liquidity or approve token spending for the Router.

3. **Configure frontend**
   - Update `routerAddress` in `swap.js`.

4. **Run locally**
   ```bash
   cd public
   python3 -m http.server
