import { getAllowance, getExchangeRate, getTokenBalances, exchangeToken, approveForMe, estimateExchangeGas, estimateTranferGas, tranferToken, checkTokenBalance } from "./services/networkService";
import EnvConfig from "./configs/env";
import { isValidEthAddress } from "./services/web3Service";

const E_18 = Math.pow(10, 18);
let currentAccount;

$(function () {
  initiateProject();

  function initiateProject() {
    const defaultSrcSymbol = EnvConfig.TOKENS[0].symbol;
    const defaultDestSymbol = EnvConfig.TOKENS[1].symbol;

    initiateDropdown();
    initiateSelectedToken(defaultSrcSymbol, defaultDestSymbol);
    initiateDefaultRate(defaultSrcSymbol, defaultDestSymbol);

    updateCurrentBalance();

    //đợi 9s rồi mới cho luồng update chạy
    setTimeout(() => {
      setInterval(() => {
        console.log('refresh Rate, DestAmount and CurrentBalance');

        const srcSymbol = $('#selected-src-symbol').text();
        const destSymbol = $('#selected-dest-symbol').text();

        const srcToken = findTokenBySymbol(srcSymbol);
        const destToken = findTokenBySymbol(destSymbol);

        const srcAmount = $('#swap-source-amount').val() * E_18;

        updateRate(srcToken.address, destToken.address);
        updateDestAmount(srcToken.address, destToken.address, srcAmount);
        updateCurrentBalance();
      }, 10000);
    }, 9000)
  }

  function initiateDropdown() {
    let dropdownTokens = '';

    EnvConfig.TOKENS.forEach((token) => {
      dropdownTokens += `<div class="dropdown__item">${token.symbol}</div>`;
    });

    $('.dropdown__content').html(dropdownTokens);

  }

  function initiateSelectedToken(srcSymbol, destSymbol) {
    $('#selected-src-symbol').html(srcSymbol);
    $('#selected-dest-symbol').html(destSymbol);
    $('#rate-src-symbol').html(srcSymbol);
    $('#rate-dest-symbol').html(destSymbol);
    $('#selected-transfer-token').html(srcSymbol);
  }

  function initiateDefaultRate(srcSymbol, destSymbol) {
    const srcToken = findTokenBySymbol(srcSymbol);
    const destToken = findTokenBySymbol(destSymbol);
    const defaultSrcAmount = E_18.toString();

    updateRate(srcToken.address, destToken.address, defaultSrcAmount);
  }

  async function updateRate(srcAddress, destAddress) {
    const amount = 1;

    try {
      const result = await getExchangeRate(srcAddress, destAddress, amount);
      const rate = result;

      $('#exchange-rate').text(rate);
    } catch (error) {
      console.log(error);
      $('#exchange-rate').text(0);
    }
  }

  async function updateDestAmount(srcAddress, destAddress, srcAmount) {
    if (isNaN(srcAmount) || srcAmount <= 0) {
      $('.input-placeholder').text(0);
    } else {
      let result = await getExchangeRate(srcAddress, destAddress, srcAmount + '');
      result = result / E_18;
      $('.input-placeholder').text(result);
    }
  }

  async function updateCurrentBalance() {
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    currentAccount = accounts[0];

    $('#current_address').text(currentAccount);

    if (currentAccount) {
      const srcSymbol = $('#selected-src-symbol').text();
      const srcToken = findTokenBySymbol(srcSymbol);

      const balance = await getTokenBalances(srcToken.address, currentAccount)

      $('#current_symbol').text(srcSymbol);
      $('#current_balance').text(balance);
    } else {
      $('#current_balance').text(0);
    }

  }

  function findTokenBySymbol(symbol) {
    return EnvConfig.TOKENS.find(token => token.symbol === symbol);
  }

  // On changing token from dropdown.
  $(document).on('click', '.dropdown__item', function () {
    const selectedSymbol = $(this).html();
    $(this).parent().siblings('.dropdown__trigger').find('.selected-target').html(selectedSymbol);

    /* DONE: Implement changing rate for Source and Dest Token here. */
    const srcSymbol = $('#selected-src-symbol').text();
    const destSymbol = $('#selected-dest-symbol').text();

    const srcToken = findTokenBySymbol(srcSymbol);
    const destToken = findTokenBySymbol(destSymbol);

    $('#rate-src-symbol').text(srcSymbol);
    $('#rate-dest-symbol').text(destSymbol);
    updateRate(srcToken.address, destToken.address);

    const srcAmount = $('#swap-source-amount').val() * E_18;
    updateDestAmount(srcToken.address, destToken.address, srcAmount);
    updateCurrentBalance();
  });

  // Import Metamask
  $('#import-metamask').on('click', async function () {
    /* DONE: Importing wallet by Metamask goes here. */
    await ethereum.request({ method: 'eth_requestAccounts' });
    updateCurrentBalance();
  });

  // Handle on Source Amount Changed
  $('#swap-source-amount').on('input change', async function () {
    /* DONE: Fetching latest rate with new amount */
    /* DONE: Updating dest amount */
    let srcString = $('#swap-source-amount').val() + '';
    srcString = srcString.replace(/([^\d.])/g, '');
    srcString = $('#swap-source-amount').val(srcString);

    const srcSymbol = $('#selected-src-symbol').text();
    const destSymbol = $('#selected-dest-symbol').text();

    const srcToken = findTokenBySymbol(srcSymbol);
    const destToken = findTokenBySymbol(destSymbol);

    const srcAmount = $('#swap-source-amount').val() * E_18;

    updateRate(srcToken.address, destToken.address);
    updateDestAmount(srcToken.address, destToken.address, srcAmount);
  });

  $('#transfer-source-amount').on('input change', async function () {
    let srcString = $('#transfer-source-amount').val() + '';
    srcString = srcString.replace(/([^\d.])/g, '');
    srcString = $('#transfer-source-amount').val(srcString);
  });

  // Handle on click token in Token Dropdown List
  $('.dropdown__item').on('click', function () {
    $(this).parents('.dropdown').removeClass('dropdown--active');
    /* TODO: Select Token logic goes here */

  });

  // Handle on click Swap icon
  $('.swap__icon').on('click', function () {
    const destSymbol = $('#selected-src-symbol').text();
    const srcSymbol = $('#selected-dest-symbol').text();

    const srcToken = findTokenBySymbol(srcSymbol);
    const destToken = findTokenBySymbol(destSymbol);

    $('#selected-src-symbol').text(srcSymbol);
    $('#selected-dest-symbol').text(destSymbol);

    $('#rate-src-symbol').text(srcSymbol);
    $('#rate-dest-symbol').text(destSymbol);


    const srcAmount = $('#swap-source-amount').val() * E_18;

    updateRate(srcToken.address, destToken.address);
    updateDestAmount(srcToken.address, destToken.address, srcAmount);

    updateCurrentBalance();
  });

  // Handle on Swap Now button clicked
  $('#swap-button').on('click', async function () {
    // const modalId = $(this).data('modal-id');
    // $(`#${modalId}`).addClass('modal--active');

    const srcSymbol = $('#selected-src-symbol').text();
    const destSymbol = $('#selected-dest-symbol').text();

    const srcToken = findTokenBySymbol(srcSymbol);
    const destToken = findTokenBySymbol(destSymbol);

    const srcAmount = $('#swap-source-amount').val();
    const destAmount = $('.input-placeholder').text();

    if(srcSymbol == destSymbol){
      alert(`Source token and destination token must not the same!`);
      return;
    }

    if(srcAmount == 0){
      alert(`You should swap some ${srcSymbol}`);
      return;
    }

    if(!(await checkTokenBalance(srcToken.address, currentAccount, srcAmount))){
      alert(`You have not enough ${srcSymbol}`);
      return;
    }

    //check Allowance from user to Exchange contract
    const allowed = await getAllowance(srcToken.address, currentAccount, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);

    let isAllowed = allowed >= (srcAmount * E_18);
    if (!isAllowed && srcToken.address == "0x0000000000000000000000000000000000000000") {
      alert(`You have not enough ETH, need ${srcAmount - allowed / E_18} ETH more`)
      return;
    }

    if (!isAllowed) {
      const approveResult = await approveForMe(srcToken.address, srcAmount * E_18, currentAccount);
      console.log({ approveResult });
      isAllowed = !!approveResult;
    }

    if (isAllowed) {
      //Confirm modal bản thiếu kinh phí
      let confirmString = 'Please confirm that you want to SWAP:\n';
      confirmString += `${srcAmount} ${srcSymbol}\n`;
      confirmString += `INTO\n`;
      confirmString += `${destAmount} ${destSymbol}\n\n`;
      confirmString += `Estimated gas: ${(await estimateExchangeGas(srcToken.address, destToken.address, srcAmount) / E_18).toFixed(18)} ETH`

      const confirmResult = confirm(confirmString);

      if (!confirmResult) return;

      const exchangeResult = await exchangeToken(srcToken.address, destToken.address, srcAmount);

      if (!!exchangeResult) {
        alert('Transaction successfully');
      } else {
        alert('Transaction failed or canceled');
      }

    } else {
      alert("Check allowance");
    }

  });

  // Handle on Tranfer Now button clicked
  $('#tranfer-button').on('click', async function () {

    const srcSymbol = $('#selected-transfer-token').text();
    const srcToken = findTokenBySymbol(srcSymbol);

    const destAddress = $('#transfer-address').val();
    //check địa chỉ ETH hợp lệ
    if(!isValidEthAddress(destAddress)){
      alert(`${destAddress} is not a valid Eth address`);
      return;
    }

    if(currentAccount == destAddress){
      alert(`Transfer to yourself make nonsense @@`);
      return;
    }

    const tranferAmount = $('#transfer-source-amount').val();

    if(tranferAmount == 0){
      alert(`You should transfer some ${srcSymbol}`);
      return;
    }

    if(!(await checkTokenBalance(srcToken.address, currentAccount, tranferAmount))){
      alert(`You have not enough ${srcSymbol}`);
      return;
    }

    //check Allowance from user to Exchange contract
    const allowed = await getAllowance(srcToken.address, currentAccount, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);

    let isAllowed = allowed >= (tranferAmount * E_18);
    if (!isAllowed && srcToken.address == "0x0000000000000000000000000000000000000000") {
      alert(`You have not enough ETH, need ${tranferAmount - allowed / E_18} ETH more`)
      return;
    }

    if (!isAllowed) {
      const approveResult = await approveForMe(srcToken.address, tranferAmount * E_18, currentAccount);
      console.log({ approveResult });
      isAllowed = !!approveResult;
    }

    if (isAllowed) {
      //Confirm modal bản thiếu kinh phí
      let confirmString = 'Please confirm that you want to Tranfer:\n';
      confirmString += `${tranferAmount} ${srcSymbol}\n`;
      confirmString += `TO address\n`;
      confirmString += `${destAddress}\n\n`;
      confirmString += `Estimated gas: ${(await estimateTranferGas(srcToken.address, destAddress, tranferAmount) / E_18).toFixed(18)} ETH`

      const confirmResult = confirm(confirmString);

      if (!confirmResult) return;

      const transferResult = await tranferToken(srcToken.address, destAddress, tranferAmount);

      if (!!transferResult) {
        alert('Transaction successfully');
      } else {
        alert('Transaction failed or canceled');
      }

    } else {
      alert("Check allowance");
    }

  });

  // Tab Processing
  $('.tab__item').on('click', function () {
    const contentId = $(this).data('content-id');
    $('.tab__item').removeClass('tab__item--active');
    $(this).addClass('tab__item--active');

    if (contentId === 'swap') {
      $('#swap').addClass('active');
      $('#transfer').removeClass('active');
    } else {
      $('#transfer').addClass('active');
      $('#swap').removeClass('active');
    }
  });

  // Dropdown Processing
  $('.dropdown__trigger').on('click', function () {
    $(this).parent().toggleClass('dropdown--active');
  });

  // Close Modal
  $('.modal').on('click', function (e) {
    if (e.target !== this) return;
    $(this).removeClass('modal--active');
  });
});
