'use client'
import React from 'react'
import useProject from '~/hooks/use-project';

const CommitLog = () => {
    const {projectId} = useProject();
  return (
    <div>CommitLog</div>
  )
}

export default CommitLog