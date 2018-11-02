 /*
 _______  _______  _______  _______         _______  _______  _______  _______ 
(  ____ \(  ____ \/ ___   )(  ___  )       (  ____ )(  ___  )(  ____ \(  ____ \
| (    \/| (    \/\/   )  || (   ) |       | (    )|| (   ) || (    \/| (    \/
| |      | (__        /   )| (___) | _____ | (____)|| (___) || (_____ | (_____ 
| | ____ |  __)      /   / |  ___  |(_____)|  _____)|  ___  |(_____  )(_____  )
| | \_  )| (        /   /  | (   ) |       | (      | (   ) |      ) |      ) |
| (___) || (____/\ /   (_/\| )   ( |       | )      | )   ( |/\____) |/\____) |
(_______)(_______/(_______/|/     \|       |/       |/     \|\_______)\_______)

Geza Kerecsenyi 2018. Share under Creative Commons Attribution-NonCommercial 4.0 International License.
*/

//Definitions of common streaks (patterns) of numbers, sorted by frequency and complexity (tier 1 is least complex)
var tier1 = ["123","234","345","456","567","789","890","0987654321","1234","2345","3456","0987","4567","5678","6789","7890","246","2468","1234567890","321","432","543","654","765","987","098","12","10","11","22","33","44","55","66","77","88","99","00"];

var tier2 = ["4321","5432","6543","7654","8765","9876","642","8642","210","54321","65432","76543","87654","98765","09876","654321","765432","7531","876543","08642","987654","963","098765","8765432","9876543210","9876543","0987654","87654321","09876543","531","852","012","0123","12345","23456","34567","45678","56789","67890","123456","234567","0246","0369","1357","345678","24680","456789","357","369","567890","2345678","0123456789","024","3456789","4567890","12345678","23456789","34567890","135","258","987654321","098765432"];

var tier3 = ["630","9753","741","123456789","234567890","01234","02468","036","048","124","3579","147","468","470","6420","9630","3210","753","420","98765432","062","086","0864"];

var tier4 = ["97531","543210","876543210","76543210","951","6543210","43210","86420","975","260","864","074","840","421","012345","012345678","01234567","159","0123456","579","680","4680","13579","1248","248"];

var words, text, wordPos, pwords;

var oReq = new XMLHttpRequest();
oReq.onreadystatechange = function(){
  if(this.readyState === 4 && this.status === 200){
    words = this.responseText.split("\n");
  }
};
oReq.open("GET", "https://raw.githubusercontent.com/dwyl/english-words/master/words.txt", true);
oReq.send();

var reqPword = new XMLHttpRequest();
reqPword.onreadystatechange = function(){
  if(this.readyState === 4 && this.status === 200){
    pwords = this.responseText.split("\n");
  }
};
reqPword.open("GET", "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Common-Credentials/10-million-password-list-top-10000.txt", true);
reqPword.send();

function score(p){
  console.time("Timing");
  //Get base score ('Best case scenario') to subract from - a weighted sum of all characters
  var score = p.split(/[a-z]/g).length + p.split(/[0-9]/g).length*1.4 + p.split(/[A-Z]/g).length*1.3 + (p.split(/[ -/]/g).length + p.split(/[\:-@]/g).length)*1.9 + (p.length - (p.split(/[a-z]/g).length + p.split(/[0-9]/g).length + p.split(/[A-Z]/g).length + p.split(/[ -/]/g).length + p.split(/[\:-@]/g).length))*1.7;


  //Penalise common 'streaks' of numbers (e.g '123')

  //Find all streaks
  var numStreak = false;
  var streaks = [];
  for (i=0;i<p.length;i++){
    if (!(numStreak||isNaN(p[i]))){
      numStreak = true;
      thisStreak = "";
    }
    if (isNaN(p[i])){
      if (numStreak){
        streaks.push(thisStreak);
      }
      numStreak = false;
    }
    if (numStreak){
      thisStreak += p[i];
    }
  }
  if (numStreak) var endStreak = thisStreak;
  //Penalise streaks
  for (i=0;i<streaks.length;i++){
    if (streaks[i].length===1){
      continue;
    }
    if (tier1.indexOf(streaks[i])>-1){
      score -= streaks[i].length;
    }
    if (tier2.indexOf(streaks[i])>-1){
      score -= streaks[i].length/2;
    }
    if (tier3.indexOf(streaks[i])>-1){
      score -= streaks[i].length/3;
    }
    if (tier4.indexOf(streaks[i])>-1){
      score -= streaks[i].length/4;
    }
  }
  //Penalise streaks at the end more, since they are more common
  if (endStreak != undefined){
    if (tier1.indexOf(endStreak)>-1){
      score -= endStreak.length + 1.5
    }
    if (tier2.indexOf(endStreak)>-1){
      score -= endStreak.length
    }
    if (tier3.indexOf(endStreak)>-1){
      score -= endStreak.length / 2
    }
    if (tier4.indexOf(endStreak)>-1){
      score -= endStreak.length / 3
    }
  }

  //Penalise words

  var ret = 0;
  wordPos = [];

  //Find all words
  for (i=0;i<words.length;i++){
    if (words[i].length > 3){
      var index = p.toLowerCase().indexOf(words[i].toLowerCase());
      if(index>-1){
        wordPos.push({
          word:words[i],
          spans:[]
        });
        for (r=index;r<index+words[i].length;r++){
          wordPos.slice(-1)[0].spans.push(r);
        }
      }
    } else {
      continue;
    }
  }
  wordPos.sort(function(a,b){
    if (b.word.length - a.word.length !== 0){
      return b.word.length - a.word.length;
    } else {
      return a.spans[0] - b.spans[0];
    }
  });
  //Ensure overlapping words don't get doubley penalised (e.g 'welcome' contains also contains 'come', but we only want to penalise 'welcome'.)
  for (i=0;i<wordPos.length;i++){
    for (q=i+1;q<wordPos.length;q++){
      var found = wordPos[i].spans.some(r => wordPos[q].spans.indexOf(r) >= 0);
      if (found){
        wordPos.splice(q,1);
        q--;
      }
    }
  }

  //Penalise
  for (i=0;i<wordPos.length;i++){
    score -= Math.log10(wordPos[i].word.length)*(wordPos[i].word.length+1);
  }

  //Penalise common passwords
  if (pwords.indexOf(p)>-1){
    if (pwords.indexOf(p)>1000){
      score -= Math.log2(10002-pwords.indexOf(p))/2.5;
    } else {
      score = 0;
    }
  }
  console.timeEnd("Timing")
  console.log(score);
}
