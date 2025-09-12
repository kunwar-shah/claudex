import React from 'react';
import { Card, Metric, Text, ProgressBar, BadgeDelta, Flex, Grid } from '@tremor/react';

// Demo component showcasing Tremor components for future use
const TremorDemo = ({ sessionStats }) => {
  const { totalMessages = 920, userMessages = 460, assistantMessages = 460, avgResponseTime = '2.3s' } = sessionStats || {};
  
  return (
    <div className="space-y-2">
      <Grid numItems={1} className="gap-2">
        <Card className="p-3">
          <Flex alignItems="start">
            <div className="truncate">
              <Text className="text-xs">Total Messages</Text>
              <Metric className="text-sm">{totalMessages}</Metric>
            </div>
            <BadgeDelta deltaType="moderateIncrease" size="xs">
              +12%
            </BadgeDelta>
          </Flex>
          <Flex className="mt-2">
            <Text className="text-xs truncate">User: {userMessages}</Text>
            <Text className="text-xs">Assistant: {assistantMessages}</Text>
          </Flex>
          <ProgressBar value={32} className="mt-2" size="sm" />
        </Card>
        
        <Card className="p-3">
          <Text className="text-xs">Avg Response Time</Text>
          <Metric className="text-sm">{avgResponseTime}</Metric>
          <Text className="text-xs mt-1">Excellent performance</Text>
        </Card>
      </Grid>
    </div>
  );
};

export default TremorDemo;