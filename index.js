import { getAllowance, getExchangeRate, getTokenBalances, exchangeToken, approveForMe, estimateExchangeGas, estimateTranferGas, tranferToken, checkTokenBalance, isValidEthAddress } from "./services/networkService";
import EnvConfig from "./configs/env";

const ONE_ETHER = Math.pow(10, 18);
let currentAccount;

$(function () {
  initiateProject();

  function initiateProject() {
    const defaultSrcSymbol = EnvConfig.TOKENS[0].symbol;
    const defaultDestSymbol = EnvConfig.TOKENS[1].symbol;

    initiateDropdown();
    initiateSelectedToken(defaultSrcSymbol, defaultDestSymbol);
    initiateDefaultRate(defaultSrcSymbol, defaultDestSymbol);
    // update current balance from metamask wallet
    updateCurrentBalance();
    //wait 9s before the interval run  
    fetchUserBalanceInterval();
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
    updateRate(srcToken.address, destToken.address);
  }

  async function updateCurrentBalance() {
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    currentAccount = accounts[0];

    $('.current_address').text(currentAccount);

    if (currentAccount) {
      const srcSymbol = $('#selected-src-symbol').text();
      const srcToken = findTokenBySymbol(srcSymbol);
      const balance = await getTokenBalances(srcToken.address, currentAccount);
      $('#current_symbol').text(srcSymbol);
      $('#current_balance').text(balance);
    } else {
      $('.current_balance').text(0);
    }
  }

  async function fetchUserBalanceInterval() {
    setTimeout(() => {
      setInterval(() => {
        const srcSymbol = $('#selected-src-symbol').text();
        const destSymbol = $('#selected-dest-symbol').text();

        const srcToken = findTokenBySymbol(srcSymbol);
        const destToken = findTokenBySymbol(destSymbol);

        const srcAmount = $('#swap-source-amount').val();

        updateRate(srcToken.address, destToken.address);
        updateDestAmount(srcToken.address, destToken.address, srcAmount);
        updateCurrentBalance();
      }, 10000);
    }, 9000)
  }

  function findTokenBySymbol(symbol) {
    return EnvConfig.TOKENS.find(token => token.symbol === symbol);
  }

  async function updateRate(srcAddress, destAddress) {
    const amount = ONE_ETHER + '';
    try {
      const result = await getExchangeRate(srcAddress, destAddress, amount);
      const rate = result / ONE_ETHER;

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
      srcAmount = srcAmount * ONE_ETHER;
      let result = await getExchangeRate(srcAddress, destAddress, srcAmount + '');
      result = result / ONE_ETHER;
      $('.input-placeholder').text(result);
    }
  }

  // Import Metamask
  $('#import-metamask').on('click', async function () {
    /* DONE: Importing wallet by Metamask goes here. */
    await ethereum.request({ method: 'eth_requestAccounts' });
    updateCurrentBalance();
  });

  // Handle on change token from dropdown.
  $(document).on('click', '.dropdown__item', function () {
    const selectedSymbol = $(this).html();
    $(this).parent().siblings('.dropdown__trigger').find('.selected-target').html(selectedSymbol);
    $(this).parents('.dropdown').removeClass('dropdown--active');
    /* DONE: Implement changing rate for Source and Dest Token here. */
    const srcSymbol = $('#selected-src-symbol').text();
    const destSymbol = $('#selected-dest-symbol').text();

    const srcToken = findTokenBySymbol(srcSymbol);
    const destToken = findTokenBySymbol(destSymbol);

    $('#rate-src-symbol').text(srcSymbol);
    $('#rate-dest-symbol').text(destSymbol);
    updateRate(srcToken.address, destToken.address);

    const srcAmount = $('#swap-source-amount').val();
    updateDestAmount(srcToken.address, destToken.address, srcAmount);
    updateCurrentBalance();
  });

  // Handle on source amount changed
  $('#swap-source-amount').on('input change', async function () {
    /* DONE: Fetching latest rate with new amount */
    /* DONE: Updating dest amount */
    let srcString = $('#swap-source-amount').val() + '';
    srcString = validateInputValue(srcString);
    srcString = $('#swap-source-amount').val(srcString);

    const srcSymbol = $('#selected-src-symbol').text();
    const destSymbol = $('#selected-dest-symbol').text();

    const srcToken = findTokenBySymbol(srcSymbol);
    const destToken = findTokenBySymbol(destSymbol);

    const srcAmount = $('#swap-source-amount').val();

    updateRate(srcToken.address, destToken.address);
    updateDestAmount(srcToken.address, destToken.address, srcAmount);
  });

  function hasMultipleDots(inputString) {
    const dotRegex = /\./g;
    const dotCount = (inputString.match(dotRegex) || []).length;
    return dotCount > 1;
  }

  function validateInputValue(inputString) {
    const validInputRegex = /([^\d.])/g;
    inputString = inputString.replace(validInputRegex, '');
    if (hasMultipleDots(inputString)) {
      inputString = inputString.slice(0, -1);
    }
    return inputString;
  }

  $('#transfer-source-amount').on('input change', async function () {
    let srcString = $('#transfer-source-amount').val() + '';
    srcString = validateInputValue(srcString);
    srcString = $('#transfer-source-amount').val(srcString);
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

    const srcAmount = $('#swap-source-amount').val();
    updateRate(srcToken.address, destToken.address);
    updateDestAmount(srcToken.address, destToken.address, srcAmount);
    updateCurrentBalance();
  });

  // Handle on Swap Now button clicked
  $('#swap-button').on('click', async function () {
    const modalId = $(this).data('modal-id');

    const srcSymbol = $('#selected-src-symbol').text();
    const destSymbol = $('#selected-dest-symbol').text();

    const srcToken = findTokenBySymbol(srcSymbol);
    const destToken = findTokenBySymbol(destSymbol);

    const srcAmount = $('#swap-source-amount').val();
    const destAmount = $('.input-placeholder').text();

    if (srcSymbol == destSymbol) {
      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-swap-modal-content`).html('<p>Source token and destination token must not the same!</p>');
      return;
    }

    if (srcAmount == 0) {
      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-swap-modal-content`).html('<p>You should swap some ' + `${srcSymbol}` + '</p>');
      return;
    }

    if (!(await checkTokenBalance(srcToken.address, currentAccount, srcAmount))) {
      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-swap-modal-content`).html('<p>You have not enough ' + `${srcSymbol}` + '</p>');
      return;
    }

    //check Allowance from user to Exchange contract
    const allowed = await getAllowance(srcToken.address, currentAccount, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);
    let isAllowed = allowed >= (srcAmount * ONE_ETHER);
    if (!isAllowed && srcToken.address == "0x0000000000000000000000000000000000000000") {
      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-swap-modal-content`).html('<p>You have not enough ETH, need ' + `${srcAmount - allowed / ONE_ETHER}` + ' ETH more</p>');
      return;
    }

    if (!isAllowed) {
      const approveResult = await approveForMe(srcToken.address, srcAmount * ONE_ETHER, currentAccount, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);
      console.log({ approveResult });
      isAllowed = !!approveResult;
    }

    if (isAllowed) {
      let confirmString = 'Please confirm that you want to SWAP</br>';
      confirmString += `<b>${srcAmount}</b> <i>${srcSymbol}</i>`;
      confirmString += ` INTO `;
      confirmString += `<b>${destAmount}</b> <i>${destSymbol}</i> </br></br>`;
      confirmString += `Estimated gas: <b>${(await estimateExchangeGas(srcToken.address, destToken.address, srcAmount) / ONE_ETHER).toFixed(18)}</b> <i>ETH</i>`;

      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-swap-modal-content`).html('<p>' + `${confirmString}` + '</p><button id="swap-modal-cancel-btn" class="modal__button red">Cancel</button><button id="swap-modal-confirm-btn" class="modal__button green">OK</button>');

    } else {
      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-swap-modal-content`).html('<p>Check allowance</p>');
    }

  });

  $('#confirm-swap-modal-content').on('click', '#swap-modal-confirm-btn', async function () {
    const srcSymbol = $('#selected-src-symbol').text();
    const destSymbol = $('#selected-dest-symbol').text();

    const srcToken = findTokenBySymbol(srcSymbol);
    const destToken = findTokenBySymbol(destSymbol);

    const srcAmount = $('#swap-source-amount').val();
    const exchangeResult = await exchangeToken(srcToken.address, destToken.address, srcAmount);

    if (!!exchangeResult) {
      $(`#swap-modal-cancel-btn`).trigger('click');
      $(this).parent().parent().addClass('modal--active');
      $(`#confirm-swap-modal-content`).html('<p>Transaction successfully</p>');
    } else {
      $(`#swap-modal-cancel-btn`).trigger('click');
      $(this).parent().parent().addClass('modal--active');
      $(`#confirm-swap-modal-content`).html('<p>Transaction failed or canceled</p>');
    }
  });

  $('#confirm-swap-modal-content').on('click', '#swap-modal-cancel-btn', function (e) {
    if (e.target !== this) return;
    $(this).parent().parent().removeClass('modal--active');
  });

  // Handle on Tranfer Now button clicked
  $('#tranfer-button').on('click', async function () {
    const modalId = $(this).data('modal-id');

    const srcSymbol = $('#selected-transfer-token').text();
    const srcToken = findTokenBySymbol(srcSymbol);

    const destAddress = $('#transfer-address').val();
    //check ETH address is valid
    if (destAddress === "") {
      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-transfer-modal-content`).html('<p>You should enter the destination address</p>');
      return;
    }
    if (!isValidEthAddress(destAddress)) {
      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-transfer-modal-content`).html('<p>' + `${destAddress}` + ' is not a valid Eth address</p>');
      return;
    }

    if (currentAccount == destAddress) {
      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-transfer-modal-content`).html('<p>Transfer to yourself make nonsense</p>');
      return;
    }

    const tranferAmount = $('#transfer-source-amount').val();

    if (tranferAmount == 0) {
      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-transfer-modal-content`).html('<p>You should transfer some' + `${srcSymbol}` + '</p>');
      return;
    }

    if (!(await checkTokenBalance(srcToken.address, currentAccount, tranferAmount))) {
      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-transfer-modal-content`).html('<p>You have not enough ' + `${srcSymbol}` + '</p>');
      return;
    }

    //check Allowance from user to Exchange contract
    const allowed = await getAllowance(srcToken.address, currentAccount, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);

    let isAllowed = allowed >= (tranferAmount * ONE_ETHER);
    if (!isAllowed && srcToken.address == "0x0000000000000000000000000000000000000000") {
      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-transfer-modal-content`).html('<p>You have not enough ETH, need ' + `${tranferAmount - allowed / ONE_ETHER}` + ' ETH more</p>')
      return;
    }

    if (!isAllowed) {
      const approveResult = await approveForMe(srcToken.address, tranferAmount * ONE_ETHER, currentAccount, EnvConfig.EXCHANGE_CONTRACT_ADDRESS);
      console.log({ approveResult });
      isAllowed = !!approveResult;
    }

    if (isAllowed) {
      let confirmString = 'Please confirm that you want to Tranfer</br>';
      confirmString += `<b>${tranferAmount}</b> <i>${srcSymbol}</i>`;
      confirmString += ` TO address `;
      confirmString += `<b>${destAddress}</b></br></br>`;
      confirmString += `Estimated gas: <b>${(await estimateTranferGas(srcToken.address, destAddress, tranferAmount) / ONE_ETHER).toFixed(18)}</b> <i>ETH</i>`

      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-transfer-modal-content`).html('<p>' + `${confirmString}` + '</p><button id="transfer-modal-cancel-btn" class="modal__button red">Cancel</button><button id="transfer-modal-confirm-btn" class="modal__button green">OK</button>');

    } else {
      $(`#${modalId}`).addClass('modal--active');
      $(`#confirm-transfer-modal-content`).html('<p>Check allowance</p>');
    }

  });

  $('#confirm-transfer-modal-content').on('click', '#transfer-modal-confirm-btn', async function () {
    const srcSymbol = $('#selected-transfer-token').text();
    const srcToken = findTokenBySymbol(srcSymbol);

    const destAddress = $('#transfer-address').val();
    const tranferAmount = $('#transfer-source-amount').val();

    const transferResult = await tranferToken(srcToken.address, destAddress, tranferAmount);
    if (!!transferResult) {
      $(`#transfer-modal-cancel-btn`).trigger('click');
      $(this).parent().parent().addClass('modal--active');
      $(`#confirm-transfer-modal-content`).html('<p>Transaction successfully</p>');
    } else {
      $(`#transfer-modal-cancel-btn`).trigger('click');
      $(this).parent().parent().addClass('modal--active');
      $(`#confirm-transfer-modal-content`).html('<p>Transaction failed or canceled</p>');
    }
  });

  $('#confirm-transfer-modal-content').on('click', '#transfer-modal-cancel-btn', function (e) {
    if (e.target !== this) return;
    $(this).parent().parent().removeClass('modal--active');
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

  function initiateSearchDropdown() {
    let dropdownTokens = '';
    EnvConfig.TOKENS.forEach((token) => {
      dropdownTokens += `<div class="token"><i><span class="token-symbol">${token.symbol}</span></i> - <b><span class="token-name">${token.name}</span></b></div>`;
    });

    $('.token-list').html(dropdownTokens);
  }

  $('#tokenSearch').on('input', function () {
    const searchTerm = $('#tokenSearch').val().toLowerCase();
    const $tokens = $('.token-list').find('.token');

    $tokens.each(function () {
      const $token = $(this);
      const tokenName = $token.find('.token-name').text().toLowerCase();
      const tokenSymbol = $token.find('.token-symbol').text().toLowerCase();

      if (tokenName.includes(searchTerm) || tokenSymbol.includes(searchTerm)) {
        $token.show();
      } else {
        $token.hide();
      }
    });
  });

  $('#src-search-button').on('click', async function () {
    const modalId = $(this).data('modal-id');
    $(`#${modalId}`).addClass('modal--active');
    initiateSearchDropdown();
    const tokens = $('.token-list').find('.token');
    tokens.each(function () {
      const token = $(this);
      token.on('click', function () {
        // Handle the click event for the token list item here

        const srcSymbol = token.find('.token-symbol').text();
        const destSymbol = $('#selected-dest-symbol').text();

        $('.dropdown__item').parent().siblings('.dropdown__trigger').find('#selected-src-symbol').html(srcSymbol);

        const srcToken = findTokenBySymbol(srcSymbol);
        const destToken = findTokenBySymbol(destSymbol);

        $('#rate-src-symbol').text(srcSymbol);
        $('#rate-dest-symbol').text(destSymbol);

        updateRate(srcToken.address, destToken.address);
        const srcAmount = $('#swap-source-amount').val();
        updateDestAmount(srcToken.address, destToken.address, srcAmount);
        updateCurrentBalance();
        $("#search-modal").removeClass('modal--active');
      });
    });
  });

  $('#dest-search-button').on('click', async function () {
    const modalId = $(this).data('modal-id');
    $(`#${modalId}`).addClass('modal--active');
    initiateSearchDropdown();
    const tokens = $('.token-list').find('.token');
    tokens.each(function () {
      const token = $(this);
      token.on('click', function () {
        // Handle the click event for the token list item here

        const srcSymbol = $('#selected-src-symbol').text();
        const destSymbol = token.find('.token-symbol').text();

        $('.dropdown__item').parent().siblings('.dropdown__trigger').find('#selected-dest-symbol').html(destSymbol);

        const srcToken = findTokenBySymbol(srcSymbol);
        const destToken = findTokenBySymbol(destSymbol);

        $('#rate-src-symbol').text(srcSymbol);
        $('#rate-dest-symbol').text(destSymbol);

        updateRate(srcToken.address, destToken.address);
        const srcAmount = $('#swap-source-amount').val();
        updateDestAmount(srcToken.address, destToken.address, srcAmount);
        updateCurrentBalance();
        $("#search-modal").removeClass('modal--active');
      });
    });
  });
});
