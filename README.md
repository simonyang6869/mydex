# 🦄 Uniswap V2 Token Swap Interface

A simple Uniswap V2-style DEX frontend that connects with MetaMask to perform token swaps.

---

## ⚙️ Setup & Deployment

1. **Deploy Contracts**
   - Deploy your **Factory** contract.
   - Deploy your **Router** contract and link it to the Factory.

2. **Add Liquidity**
   - Approve token spending for the Router or add initial liquidity pairs.

3. **Configure Frontend**
   - Open `public/swap.js` and update:
     ```js
     const routerAddress = "YOUR_ROUTER_ADDRESS";
     ```

4. **Run Locally**
   ```bash
   cd public
   python3 -m http.server
