(() => {
  const quiz = document.querySelector(".sound-quiz");
  const audio = quiz.querySelector("[data-sound-audio]");
  const play = quiz.querySelector("[data-sound-play]");
  const stop = quiz.querySelector("[data-sound-stop]");
  const volume = quiz.querySelector("[data-sound-volume]");
  const status = quiz.querySelector("[data-sound-status]");
  const options = quiz.querySelectorAll(".sound-quiz__option");
  const result = quiz.querySelector("[data-sound-result]");

  function updatePlaybackState() {
    play.setAttribute("aria-pressed", String(!audio.paused && !audio.ended && !audio.error));
  }

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
  });
  audio.volume = Number(volume.value);

  play.addEventListener("click", async () => {
    status.textContent = "";
    try {
      await audio.play();
    } catch (error) {
      if (error.name !== "AbortError") {
        status.textContent = "소리를 재생하지 못했습니다. 재생 버튼을 다시 눌러주세요.";
      }
    }
  });

  stop.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    status.textContent = "";
  });

  for (const event of ["play", "pause", "ended"]) {
    audio.addEventListener(event, updatePlaybackState);
  }

  audio.addEventListener("error", () => {
    status.textContent = "소리 파일을 불러오지 못했습니다.";
    updatePlaybackState();
  });

  for (const option of options) {
    option.addEventListener("click", () => {
      for (const answer of options) {
        answer.setAttribute("aria-pressed", String(answer === option));
      }
      if (!result.textContent) result.textContent = result.dataset.soundResult;
    });
  }
})();
