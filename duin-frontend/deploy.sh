#!/bin/bash
pnpm build && \

rsync -avz --progress -e "ssh -i ~/.ssh/pineappl-key.pem" \
  .next \
  package.json \
  pnpm-lock.yaml \
  next.config.js \
  public \
  ubuntu@ec2-13-202-3-61.ap-south-1.compute.amazonaws.com:/home/ubuntu/duin-frontend/

ssh -i ~/.ssh/pineappl-key.pem ubuntu@ec2-13-202-3-61.ap-south-1.compute.amazonaws.com "cd /home/ubuntu/duin-frontend && pnpm install --prod --frozen-lockfile && pm2 restart duin-frontend"