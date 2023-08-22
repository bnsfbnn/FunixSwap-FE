import { getTokenContract, getExchangeContract, getWeb3Instance } from "./web3Service";

const ONE_ETHER = Math.pow(10, 18);

export function getSwapABI(data) {
  /*TODO: Get Swap ABI*/
}

export function getTransferABI(data) {
  /*TODO: Get Transfer ABI*/
}

export function getApproveABI(srcTokenAddress, amount) {
  /*TODO: Get Approve ABI*/
}

export async function getExchangeRate(srcTokenAddress, destTokenAddress, srcAmount) {
  const exchangeContract = getExchangeContract();
  try {
    const result = await exchangeContract.methods.getExchangeRate(srcTokenAddress, destTokenAddress, srcAmount).call();
    return result;
  } catch (error) {
    console.log(error);
  }
}

export async function getTokenBalances(tokenAddress, walletAddress) {
  /*DONE: Get Token Balance*/
  const web3 = getWeb3Instance();
  let balance = -1;
  if (tokenAddress == "0x0000000000000000000000000000000000000000") {
    balance = await web3.eth.getBalance(walletAddress) / ONE_ETHER;
  } else {
    const contract = getTokenContract(tokenAddress);
    balance = await contract.methods.balanceOf(walletAddress).call() / ONE_ETHER;
  }
  return balance;
}

export async function checkTokenBalance(tokenAddress, walletAddress, srcAmount) {
  const currentBalance = await getTokenBalances(tokenAddress, walletAddress);
  const isEnough = currentBalance >= srcAmount;
  return isEnough;
}

export async function getAllowance(srcTokenAddress, address, spender) {
  /*DONE: Get current allowance for a token in user wallet*/
  if (srcTokenAddress != "0x0000000000000000000000000000000000000000") {
    const contract = getTokenContract(srcTokenAddress);
    const allowed = await contract.methods.allowance(address, spender).call();
    return allowed;
  } else {
    const web3 = getWeb3Instance();
    const weiBalance = await web3.eth.getBalance(address);
    return weiBalance;
  }
}

export async function approveForMe(srcTokenAddress, srcAmount, tokenOwner, spender) {
  const contract = getTokenContract(srcTokenAddress);
  const isSuccess = await contract.methods.approve(spender, srcAmount + '').send({ from: tokenOwner });
  return isSuccess;
}

export async function estimateExchangeGas(srcAddress, destAddress, srcAmount) {
  const accounts = await ethereum.request({ method: 'eth_accounts' });
  const currentAccount = accounts[0];
  const exchangeContract = getExchangeContract();

  try {
    console.log("Vào Hàm");
    if (srcAddress != "0x0000000000000000000000000000000000000000" &&
      destAddress != "0x0000000000000000000000000000000000000000") {
      console.log("Đổi 2 Token");
      const gas = await exchangeContract.methods.exchange(srcAddress, destAddress, (srcAmount * ONE_ETHER) + '').estimateGas({ from: currentAccount });
      console.log("Đổi thành công ko ? " + gas);
      return gas * 20000000000;
    } else if (destAddress != "0x0000000000000000000000000000000000000000") {
      const gas = await exchangeContract.methods.exchangeEthToToken(destAddress).estimateGas({ from: currentAccount, value: srcAmount * ONE_ETHER });
      return gas * 20000000000;
    } else {
      console.log("Đổi 1 Token sang ETH");
      const gas = await exchangeContract.methods.exchangeTokenToEth(srcAddress, (srcAmount * ONE_ETHER) + '').estimateGas({ from: currentAccount });
      console.log("Đổi thành công ko ? " + gas);
      return gas * 20000000000;
    }
  } catch (error) {
    console.log("Looix");
    console.log(error);
  }
}

export async function exchangeToken(srcAddress, destAddress, srcAmount) {
  const accounts = await ethereum.request({ method: 'eth_accounts' });
  const currentAccount = accounts[0];

  const exchangeContract = getExchangeContract();

  try {
    //Token => Token
    if (srcAddress != "0x0000000000000000000000000000000000000000" &&
      destAddress != "0x0000000000000000000000000000000000000000") {
      const exchangeAmount = await exchangeContract.methods.exchange(srcAddress, destAddress, (srcAmount * ONE_ETHER) + '').send({ from: currentAccount });
      return exchangeAmount;
      //Eth => Token
    } else if (destAddress != "0x0000000000000000000000000000000000000000") {
      const exchangeAmount = await exchangeContract.methods.exchangeEthToToken(destAddress)
        .send({
          from: currentAccount,
          value: srcAmount * ONE_ETHER
        });

      return exchangeAmount;
      //Token => Eth
    } else {
      const exchangeAmount = await exchangeContract.methods.exchangeTokenToEth(srcAddress, (srcAmount * ONE_ETHER) + '').send({ from: currentAccount });
      return exchangeAmount;
    }
  } catch (error) {
    console.log(error);
  }
}

export async function estimateTranferGas(srcTokenAddress, destAddress, srcAmount) {
  const accounts = await ethereum.request({ method: 'eth_accounts' });
  const currentAccount = accounts[0];

  try {
    if (srcTokenAddress != "0x0000000000000000000000000000000000000000") {
      const tokenContract = getTokenContract(srcTokenAddress);

      const gas = await tokenContract.methods.transfer(destAddress, (srcAmount * ONE_ETHER) + '').estimateGas({ from: currentAccount });
      console.log(gas);
      return gas * 20000000000;
    } else {
      const web3 = getWeb3Instance();
      const gas = await web3.eth.estimateGas({from: currentAccount, to: destAddress, value: srcAmount * ONE_ETHER })
      return gas * 20000000000;
    }
  } catch (error) {
    console.log(error);
  }
}
export async function tranferToken(srcTokenAddress, destAddress, srcAmount) {
  const accounts = await ethereum.request({ method: 'eth_accounts' });
  const currentAccount = accounts[0];

  try {
    if (srcTokenAddress != "0x0000000000000000000000000000000000000000") {
      const tokenContract = getTokenContract(srcTokenAddress);

      const isSuccess = await tokenContract.methods.transfer(destAddress, (srcAmount * ONE_ETHER) + '').send({ from: currentAccount });
      return isSuccess;
    } else {
      const web3 = getWeb3Instance();
      const result = await web3.eth.sendTransaction({ from: currentAccount, to: destAddress, value: srcAmount * ONE_ETHER })
      return result;
    }
  } catch (error) {
    console.log(error);
  }
}

export function isValidEthAddress(susAddress) {
  const web3 = getWeb3Instance();
  return web3.utils.isAddress(susAddress);
}
