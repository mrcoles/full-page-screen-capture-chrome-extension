// Copyright (c) 2012,2013 Peter Coles - http://mrcoles.com/ - All rights reserved.
// Use of this source code is governed by the MIT License found in LICENSE.

let currentTab;
let captureBlobs = [];
let capturing = false;

const byId = (id) => document.getElementById(id);

function showState(id) {
  document.querySelectorAll('.state').forEach((state) => {
    state.hidden = state.id !== id;
  });
}

function setFeedback(message, failed = false) {
  const feedback = byId('feedback');
  feedback.textContent = message;
  feedback.classList.toggle('failure', failed);
}

function progress(complete) {
  const percent = Math.max(0, Math.min(100, Math.round(complete * 100)));
  byId('bar').style.width = `${percent}%`;
  const progressbar = document.querySelector('[role="progressbar"]');
  progressbar.setAttribute('aria-valuenow', String(percent));
  byId('status-text').textContent = percent
    ? `Capturando… ${percent}%`
    : 'Preparando a captura…';
}

function errorHandler(reason) {
  capturing = false;
  const messages = {
    'invalid url': 'Esta página é protegida pelo Chrome e não permite capturas. Abra uma página comum da web e tente novamente.',
    'execute timeout': 'A página demorou demais para responder. Recarregue-a e tente novamente.',
    'injection failed': 'Não foi possível acessar esta página. Verifique se ela terminou de carregar e tente novamente.',
    'capture failed': 'O Chrome não conseguiu capturar uma parte da página. Tente novamente.'
  };
  byId('error-message').textContent = messages[reason] || 'Ocorreu um erro inesperado. Recarregue a página e tente novamente.';
  showState('error');
}

function captureFinished(blobs) {
  capturing = false;
  captureBlobs = blobs || [];
  if (!captureBlobs.length) {
    errorHandler('capture failed');
    return;
  }

  const split = captureBlobs.length > 1;
  byId('result-message').textContent = split
    ? `A página foi dividida em ${captureBlobs.length} imagens por exceder os limites do navegador. Abra todas as partes para ver a captura completa.`
    : 'A imagem está pronta para copiar ou abrir.';
  byId('copy-image').disabled = split;
  byId('copy-image').title = split
    ? 'Não é possível copiar uma captura dividida em várias imagens.'
    : 'Copiar a captura como imagem PNG';
  byId('open-image').textContent = split ? 'Abrir todas as imagens' : 'Abrir imagem';
  setFeedback('');
  showState('result');
}

async function startCapture() {
  if (capturing) return;
  capturing = true;
  captureBlobs = [];
  progress(0);
  showState('loading');

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
    if (!currentTab) throw new Error('invalid url');
    CaptureAPI.captureToBlobs(currentTab, captureFinished, errorHandler, progress);
  } catch (error) {
    console.error('Falha ao iniciar a captura:', error);
    errorHandler(error.message);
  }
}

async function copyImage() {
  if (captureBlobs.length !== 1) return;
  setFeedback('Copiando…');
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': captureBlobs[0] })
    ]);
    setFeedback('Imagem copiada para a área de transferência!');
  } catch (error) {
    console.error('Falha ao copiar a imagem:', error);
    setFeedback('Não foi possível copiar a imagem. Verifique a permissão da área de transferência e tente novamente.', true);
  }
}

function openImages() {
  captureBlobs.forEach((blob, index) => {
    const url = URL.createObjectURL(blob);
    chrome.tabs.create({
      url,
      active: index === captureBlobs.length - 1,
      openerTabId: currentTab && currentTab.id
    });
  });
}

byId('copy-image').addEventListener('click', copyImage);
byId('open-image').addEventListener('click', openImages);
byId('capture-again').addEventListener('click', startCapture);
byId('retry').addEventListener('click', startCapture);

startCapture();
