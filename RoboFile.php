<?php
/**
 * This is project's console commands configuration for Robo task runner.
 *
 * @see https://robo.li/
 */
class RoboFile extends \Robo\Tasks
{
    // define public methods as commands
    public function build()
    {
        $this->taskExec('cd web && npm install && npm run build')
            ->run();

        // move web/dist to ./docs
        $this->taskExec('rm -rf docs && mv web/dist docs')->run();

    }
}
