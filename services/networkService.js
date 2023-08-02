import EnvConfig from "../configs/env";
import { getTokenContract, getExchangeContract, getWeb3Instance } from "./web3Service";

const E_18 = Math.pow(10, 18);

export function getSwapABI(data) {
  /*TODO: Get Swap ABI*/
}

export function getTransferABI(data) {
  /*TODO: Get Transfer ABI*/
}

export function getApproveABI(srcTokenAddress, amount) {
  /*TODO: Get Approve ABI*/
}

export async function approveForMe(srcTokenAddress, srcAmount, tokenOwner) {
  const contract = getTokenContract(srcTokenAddress);
  const isSuccess = await contract.methods.approve(EnvConfig.EXCHANGE_CONTRACT_ADDRESS, srcAmount + '').send({ from: tokenOwner });

  return isSuccess;
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

/* Get Exchange Rate from Smart Contract */
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
    balance = await web3.eth.getBalance(walletAddress) / E_18;
  } else {
    const contract = getTokenContract(tokenAddress);
    balance = await contract.methods.balanceOf(walletAddress).call() / E_18;
  }

  return balance;
}

export async function checkTokenBalance(tokenAddress, walletAddress, biggerThanThis){
  const currentBalance = await getTokenBalances(tokenAddress, walletAddress);
  return currentBalance  >= biggerThanThis;
}

export async function exchangeToken(srcAddress, destAddress, srcAmount) {
  const accounts = await ethereum.request({ method: 'eth_accounts' });
  const currentAccount = accounts[0];

  const exchangeContract = getExchangeContract();

  try {
    //Token => Token
    if (srcAddress != "0x0000000000000000000000000000000000000000" &&
      destAddress != "0x0000000000000000000000000000000000000000") {

      const exchangeAmount = await exchangeContract.methods.exchange(srcAddress, destAddress, (srcAmount * E_18) + '').send({ from: currentAccount });
      return exchangeAmount;
      //Eth => Token
    } else if (destAddress != "0x0000000000000000000000000000000000000000") {
      const exchangeAmount = await exchangeContract.methods.exchangeEthToToken(destAddress)
        .send({
          from: currentAccount,
          value: srcAmount * E_18
        });

      return exchangeAmount;
      //Token => Eth
    } else{
      const exchangeAmount = await exchangeContract.methods.exchangeTokenToEth(srcAddress, (srcAmount * E_18) + '')
        .send({from: currentAccount});

      return exchangeAmount;
    }
  } catch (error) {
    console.log(error);
  }
}

export async function estimateExchangeGas(srcAddress, destAddress, srcAmount) {
  const accounts = await ethereum.request({ method: 'eth_accounts' });
  const currentAccount = accounts[0];

  const exchangeContract = getExchangeContract();

  try {
    if (srcAddress != "0x0000000000000000000000000000000000000000" &&
      destAddress != "0x0000000000000000000000000000000000000000") {

      const gas = await exchangeContract.methods.exchange(srcAddress, destAddress, (srcAmount * E_18) + '').estimateGas({ from: currentAccount });
      console.log(gas);
      return gas * 20000000000;
    } else if (destAddress != "0x0000000000000000000000000000000000000000") {
      const gas = await exchangeContract.methods.exchangeEthToToken(destAddress)
        .estimateGas({
          from: currentAccount,
          value: srcAmount * E_18
        });

      return gas * 20000000000;
    }else{
      const gas = await exchangeContract.methods.exchangeTokenToEth(srcAddress, (srcAmount * E_18) + '').estimateGas({ from: currentAccount });
      console.log(gas);
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

      const isSuccess = await tokenContract.methods.transfer(destAddress, (srcAmount * E_18) + '').send({from: currentAccount});
      return isSuccess;
    } else {
      const web3 = getWeb3Instance();
      const result = await web3.eth.sendTransaction({from: currentAccount, to: destAddress, value: srcAmount * E_18})
      return result;
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

      const gas = await tokenContract.methods.transfer(destAddress, (srcAmount * E_18) + '').estimateGas({ from: currentAccount });
      console.log(gas);
      return gas * 20000000000;
    } else {
      const web3 = getWeb3Instance();
      const gas = await web3.eth.estimateGas({
        from: currentAccount,
        to: destAddress,
        value: srcAmount * E_18
      })
      return gas * 20000000000;
    }
  } catch (error) {
    console.log(error);
  }
}