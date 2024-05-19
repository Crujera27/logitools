/*
.____                 .__  __                .__          
|    |    ____   ____ |__|/  |_  ____   ____ |  |   ______
|    |   /  _ \ / ___\|  \   __\/  _ \ /  _ \|  |  /  ___/
|    |__(  <_> ) /_/  >  ||  | (  <_> |  <_> )  |__\___ \ 
|_______ \____/\___  /|__||__|  \____/ \____/|____/____  >
        \/    /_____/                                  \/ 
                         
        
    Copyright (C) 2024  Ángel Crujera (angel.c@galnod.com)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
    
    GitHub: https://github.com/Crujera27/
    Website: https://crujera.galnod.com

*/
  // video random
  const videoList = [
    "https://www.youtube.com/embed/iCZSxRBd6i8",
    "https://www.youtube.com/embed/Q6gFgHKeGdI",
    "https://www.youtube.com/embed/FMkmcdAryZE",
    "https://www.youtube.com/embed/th8WmUFW2XU",
    "https://www.youtube.com/embed/AT1B0PktIRo",
    "https://www.youtube.com/embed/VEbZFKt9Ko8",
    "https://www.youtube.com/embed/4mvmgomaCL4",
    "https://www.youtube.com/embed/8-MLnWEKV-c",
    "https://www.youtube.com/embed/K1EsYbLD97M",
    "https://www.youtube.com/embed/qSpEz0wRM5E",
    "https://www.youtube.com/embed/EY7mD_uoqqg",
    "https://www.youtube.com/embed/nWDojmYEybc",
    "https://www.youtube.com/embed/JvzfYFZElII",
    "https://www.youtube.com/embed/UP6XTRarKeA",
    "https://www.youtube.com/embed/r7ulxdcNAVc",
    "https://www.youtube.com/embed/h-tbisrxCbU",
    "https://www.youtube.com/embed/du7JWRSUx-U",
    "https://www.youtube.com/embed/2E2jPuKx7mI",
    "https://www.youtube.com/embed/R0Pbvdfz7wc",
    "https://www.youtube.com/embed/C0fu-sKIIWI",
    "https://www.youtube.com/embed/tbsMfaC3b88"
  ];
  function setRandomVideo() {
    const randomIndex = Math.floor(Math.random() * videoList.length);
    const randomVideoUrl = videoList[randomIndex];
    const iframe = document.getElementById("randomVideo");
    iframe.src = randomVideoUrl;
  }
  window.addEventListener("load", setRandomVideo);