#!/bin/bash

FILE="frontend/src/pages/ChatModerno/index.jsx"

# Fix location 1 (lines 985-995)
sed -i '987,994c\    const message = optimisticMessagesRef.current.get(tempId);\n    if (message) {\n      optimisticMessagesRef.current.set(tempId, { ...message, ack: newAck });\n      forceUpdate();\n    }' "$FILE"

# Fix location 2 dependency array (line 995)
sed -i '995s/\[\]/[forceUpdate]/' "$FILE"

# Fix location 3 (lines 2169-2185 - cleanup interval)
sed -i '2169,2185c\      let removedCount = 0;\n      const toRemove = [];\n\n      optimisticMessagesRef.current.forEach((message, tempId) => {\n        const messageTime = new Date(message.createdAt).getTime();\n        if (messageTime <= cutoff) {\n          toRemove.push(tempId);\n          removedCount++;\n        }\n      });\n\n      toRemove.forEach(tempId => {\n        optimisticMessagesRef.current.delete(tempId);\n      });\n\n      if (removedCount > 0) {\n        forceUpdate();\n      }' "$FILE"

echo "Fixed both locations!"
