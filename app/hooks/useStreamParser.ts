import { useState, useCallback } from 'react';
import { TokenData } from '../services/api';

interface UseStreamParserReturn {
  parsedTokens: TokenData[];
  isJsonParseError: boolean;
  parseStreamContent: (content: string) => TokenData[];
  clearParsedContent: () => void;
}

export function useStreamParser(): UseStreamParserReturn {
  const [parsedTokens, setParsedTokens] = useState<TokenData[]>([]);
  const [isJsonParseError, setIsJsonParseError] = useState(false);

  const parseStreamContent = useCallback((content: string): TokenData[] => {
    try {
      if (!content || content.trim() === '') {
        return [];
      }
      
      let processedContent = content;
      
      const jsonMatch = content.match(/```json\n([\s\S]*?)(\n```|$)/);
      if (jsonMatch && jsonMatch[1]) {
        processedContent = jsonMatch[1].trim();
        processedContent = processedContent.replace(/[`]/g, '').trim();
        
        if (!processedContent.endsWith(']') && processedContent.startsWith('[')) {
          console.log("发现不完整的JSON块，尝试补全");
          const lastObjectEnd = processedContent.lastIndexOf('},');
          if (lastObjectEnd !== -1) {
            processedContent = processedContent.substring(0, lastObjectEnd + 1) + ']';
          } else {
            const firstObjectStart = processedContent.indexOf('{');
            if (firstObjectStart !== -1) {
              const partialObject = processedContent.substring(firstObjectStart);
              if (partialObject.includes('":')) {
                return [];
              }
            }
            return [];
          }
        }
      } else {
        processedContent = processedContent.replace(/[`]/g, '').trim();
        
        if (!processedContent.startsWith('[') && !processedContent.startsWith('{')) {
          const jsonStart = processedContent.search(/[\[\{]/);
          if (jsonStart !== -1) {
            processedContent = processedContent.substring(jsonStart);
          }
        }
        
        const arrayStart = processedContent.indexOf('[');
        const arrayEnd = processedContent.lastIndexOf(']');
        
        if (arrayStart !== -1 && arrayEnd === -1) {
          const lastObjectEnd = processedContent.lastIndexOf('},');
          if (lastObjectEnd !== -1 && lastObjectEnd > arrayStart) {
            processedContent = processedContent.substring(arrayStart, lastObjectEnd + 1) + ']';
          } else {
            return [];
          }
        } else if (arrayStart !== -1 && arrayEnd !== -1) {
          processedContent = processedContent.substring(arrayStart, arrayEnd + 1);
        }
      }
      
      // Additional validation before parsing
      if (!processedContent || processedContent.trim().length < 10) {
        return [];
      }
      
      // Check for basic JSON structure integrity
      const openBraces = (processedContent.match(/\{/g) || []).length;
      const closeBraces = (processedContent.match(/\}/g) || []).length;
      const openBrackets = (processedContent.match(/\[/g) || []).length;
      const closeBrackets = (processedContent.match(/\]/g) || []).length;
      
      // If severely unbalanced, don't even attempt to parse
      if (openBraces - closeBraces > 3 || openBrackets - closeBrackets > 1) {
        return [];
      }
      
      try {
        const parsed = JSON.parse(processedContent) as TokenData[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validTokens = parsed.filter(item => 
            item && typeof item === 'object' && 'word' in item && 'pos' in item
          );
          if (validTokens.length > 0) {
            setIsJsonParseError(false);
            setParsedTokens(validTokens);
            return validTokens;
          }
        }
        return [];
      } catch (e) {
        // Enhanced error handling with more specific JSON fixes
        if (e instanceof SyntaxError && e.message.includes('Unexpected EOF')) {
          console.log("处理 EOF 错误，尝试修复JSON结构");
          
          // Try to fix common EOF issues
          let fixedContent = processedContent;
          
          // If it ends with incomplete object, try to close it
          if (fixedContent.includes('{') && !fixedContent.trim().endsWith('}') && !fixedContent.trim().endsWith(']')) {
            // Find the last complete field and close properly
            const lastQuote = fixedContent.lastIndexOf('"');
            const lastColon = fixedContent.lastIndexOf(':');
            const lastComma = fixedContent.lastIndexOf(',');
            
            if (lastColon > lastQuote && lastQuote > lastComma) {
              // We're in the middle of a value, truncate to last complete field
              if (lastComma > -1) {
                fixedContent = fixedContent.substring(0, lastComma);
              } else {
                // Find the opening of current object
                const lastOpenBrace = fixedContent.lastIndexOf('{');
                if (lastOpenBrace > -1) {
                  fixedContent = fixedContent.substring(0, lastOpenBrace);
                  if (fixedContent.trim().endsWith(',')) {
                    fixedContent = fixedContent.trim().slice(0, -1);
                  }
                }
              }
            }
            
            // Balance braces and brackets
            while ((fixedContent.match(/\{/g) || []).length > (fixedContent.match(/\}/g) || []).length) {
              fixedContent += '}';
            }
            while ((fixedContent.match(/\[/g) || []).length > (fixedContent.match(/\]/g) || []).length) {
              fixedContent += ']';
            }
            
            try {
              const fixedParsed = JSON.parse(fixedContent) as TokenData[];
              if (Array.isArray(fixedParsed) && fixedParsed.length > 0) {
                const validTokens = fixedParsed.filter(item => 
                  item && typeof item === 'object' && 'word' in item && 'pos' in item
                );
                if (validTokens.length > 0) {
                  console.log("JSON修复成功");
                  setIsJsonParseError(false);
                  setParsedTokens(validTokens);
                  return validTokens;
                }
              }
            } catch (fixError) {
              console.log("JSON修复失败:", fixError);
            }
          }
        }
        
        console.log("无法解析处理后的JSON:", processedContent.substring(0, 200) + "...");
        console.error(e);
        return [];
      }
    } catch (e) {
      console.error("解析JSON时出错:", e);
      console.debug("尝试解析的内容:", content);
      setIsJsonParseError(true);
      return [];
    }
  }, []);

  const clearParsedContent = useCallback(() => {
    setParsedTokens([]);
    setIsJsonParseError(false);
  }, []);

  return {
    parsedTokens,
    isJsonParseError,
    parseStreamContent,
    clearParsedContent,
  };
}