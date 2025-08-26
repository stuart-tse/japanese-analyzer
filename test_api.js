// Test script to verify layout preservation in the Japanese Analyzer
const testText = `今日は良い天気ですね。
明日も晴れるでしょう。`;

console.log('Testing layout preservation with multi-line Japanese text:');
console.log('Input text:');
console.log(JSON.stringify(testText));
console.log('\nExpected: Text should contain \\n characters');
console.log('Lines:', testText.split('\n').map((line, i) => `${i + 1}: "${line}"`));

// Test the analyze API
const prompt = `请对以下日语句子进行详细的词法分析，并以JSON数组格式返回结果。每个对象应包含以下字段："word", "pos", "furigana", "romaji"。

请特别注意以下分析要求：
1. 将助动词与对应动词正确结合。如"食べた"应作为一个单词，而不是分开为"食べ"和"た"。
2. 正确识别动词的时态变化，如"いた"是"いる"的过去时，应作为一个完整单词处理。
3. 合理处理助词，应当与前后词汇适当分离。
4. 避免过度分词，特别是对于构成一个语法或语义单位的组合。
5. 对于复合词，如"持って行く"，根据语义和使用习惯确定是作为一个词还是分开处理。
6. 重要：如果待解析的句子中包含换行符，请在对应的位置输出一个JSON对象：{"word": "\n", "pos": "改行", "furigana": "", "romaji": ""}.
7. 如果有空格，请输出：{"word": " ", "pos": "空格", "furigana": "", "romaji": ""}.

确保输出是严格的JSON格式，不包含任何markdown或其他非JSON字符。

待解析句子： "${testText}"`;

fetch('http://localhost:3000/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ prompt: prompt })
})
.then(response => response.json())
.then(data => {
  console.log('\n=== API RESPONSE ===');
  console.log('Token count:', data.tokens?.length || 0);
  
  if (data.tokens) {
    // Find line break tokens
    const lineBreakTokens = data.tokens.filter(token => token.pos === '改行');
    console.log('\nLine break tokens found:', lineBreakTokens.length);
    
    // Also check for space tokens
    const spaceTokens = data.tokens.filter(token => token.pos === '空格');
    console.log('Space tokens found:', spaceTokens.length);
    
    if (lineBreakTokens.length > 0) {
      console.log('✅ PASS: Line break tokens detected');
      lineBreakTokens.forEach((token, index) => {
        console.log(`  Line break ${index + 1}:`, JSON.stringify(token));
      });
    } else {
      console.log('❌ FAIL: No line break tokens found');
    }
    
    // Show all tokens for debugging
    console.log('\nAll tokens:');
    data.tokens.forEach((token, index) => {
      const display = token.pos === '改行' ? '[LINE BREAK]' : token.word;
      console.log(`${index.toString().padStart(2, ' ')}: ${display} (${token.pos})`);
    });
    
    // Check if tokens maintain original text structure
    const reconstructed = data.tokens.map(token => token.word).join('');
    const matches = reconstructed === testText;
    console.log('\nText reconstruction:');
    console.log('Original :', JSON.stringify(testText));
    console.log('Reconstructed:', JSON.stringify(reconstructed));
    console.log('Matches  :', matches ? '✅ PASS' : '❌ FAIL');
  } else {
    console.log('❌ FAIL: No tokens in response');
    console.log('Response:', data);
  }
})
.catch(error => {
  console.error('❌ FAIL: API request failed:', error);
});