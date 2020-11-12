# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|

  config.vm.box = "ubuntu/bionic64"
  config.vm.box_check_update = false

  config.vm.network "private_network", ip: "192.168.33.50"

  config.vm.synced_folder '.', '/vagrant', SharedFoldersEnableSymlinksCreate: false

  config.vm.provision "shell", inline: <<-SHELL
     export DEBIAN_FRONTEND=noninteractive
     curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
     apt-get install -y nodejs
     cd /vagrant
     npm install --no-bin-links
  SHELL
end
