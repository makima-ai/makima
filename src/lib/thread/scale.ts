import { eq, desc, asc } from "drizzle-orm";
import { db } from "../../db";
import { summariesTable } from "../../db/schema";
import { getMessagesByThreadId, getThreadDetailsById } from "../../db/thread";
import { generateSummary } from "../inference/summarize";
import type {
  Agent,
  BlockScalingConfig,
  Message,
  ThresholdScalingConfig,
  WindowScalingConfig,
} from "../inference/types";

export async function getScaledMessages(
  contextId: string,
  agent: Agent,
): Promise<Message[]> {
  const context = await getThreadDetailsById(contextId);
  if (!context) {
    throw new Error("Context not found");
  }

  const allMessages = await getMessagesByThreadId(contextId);

  if (!context.scaling_algorithm || !context.scaling_config) {
    console.log("No scaling algorithm or config");
    return allMessages;
  }

  switch (context.scaling_algorithm) {
    case "window": {
      const config = context.scaling_config as WindowScalingConfig;
      return allMessages.slice(-config.windowSize);
    }

    case "threshold": {
      const config = context.scaling_config as ThresholdScalingConfig;
      if (allMessages.length <= config.totalWindow) {
        return allMessages;
      }

      const existingSummary = await db
        .select()
        .from(summariesTable)
        .where(eq(summariesTable.context_id, contextId))
        .orderBy(desc(summariesTable.created_at))
        .limit(1)
        .execute();

      let summaryMessage: Message;
      if (existingSummary.length === 0) {
        const messagesToSummarize = allMessages.slice(
          0,
          -config.summarizationThreshold,
        );
        const summary = await generateSummary(
          messagesToSummarize,
          agent.primaryModel,
        );

        const [newSummary] = await db
          .insert(summariesTable)
          .values({
            context_id: contextId,
            start_message_id: messagesToSummarize[0].db_id,
            end_message_id:
              messagesToSummarize[messagesToSummarize.length - 1].db_id,
            summary_content: summary.content,
          })
          .returning()
          .execute();

        summaryMessage = {
          ...summary,
          db_id: newSummary.id,
          context_id: contextId,
        };
      } else {
        summaryMessage = {
          role: "system",
          content: existingSummary[0].summary_content || "",
          db_id: existingSummary[0].id,
          context_id: contextId,
        };
      }

      return [
        summaryMessage,
        ...allMessages.slice(-config.summarizationThreshold),
      ];
    }

    case "block": {
      const config = context.scaling_config as BlockScalingConfig;
      const totalBlocks = Math.ceil(allMessages.length / config.blockSize);
      console.log("totalBlocks", totalBlocks);
      if (totalBlocks <= 1) {
        console.log("totalBlocks <= 1");
        return allMessages;
      }

      const existingBlockSummaries = await db
        .select()
        .from(summariesTable)
        .where(eq(summariesTable.context_id, contextId))
        .orderBy(asc(summariesTable.block_number))
        .execute();

      const summaries: Message[] = [];
      console.log("existingBlockSummaries", existingBlockSummaries);
      let currentBlock = 0;

      while (currentBlock < totalBlocks - 1) {
        const blockStart = currentBlock * config.blockSize;
        const blockEnd = Math.min(
          (currentBlock + 1) * config.blockSize,
          allMessages.length,
        );
        const blockMessages = allMessages.slice(blockStart, blockEnd);

        const existingSummary = existingBlockSummaries.find(
          (s) => s.block_number === currentBlock,
        );

        if (existingSummary) {
          summaries.push({
            role: "system",
            content: existingSummary.summary_content || "",
            db_id: existingSummary.id,
            context_id: contextId,
          });
        } else {
          const summary = await generateSummary(
            blockMessages,
            agent.primaryModel,
          );
          const [newSummary] = await db
            .insert(summariesTable)
            .values({
              context_id: contextId,
              start_message_id: blockMessages[0].db_id,
              end_message_id: blockMessages[blockMessages.length - 1].db_id,
              summary_content: summary.content,
              block_number: currentBlock,
            })
            .returning()
            .execute();

          summaries.push({
            ...summary,
            db_id: newSummary.id,
            context_id: contextId,
          });
        }

        currentBlock++;
      }

      // Add the most recent block's messages as-is
      const lastBlockMessages = allMessages.slice(
        (totalBlocks - 1) * config.blockSize,
      );
      return [...summaries, ...lastBlockMessages];
    }

    default:
      console.error("Unknown scaling algorithm:", context.scaling_algorithm);
      return allMessages;
  }
}
